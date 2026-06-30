"""Headless learning loop entrypoint: ``python -m app.run_simulation``.

Wires the synthetic environment, the candidate sampler, the VW policy, guardrails, and
the metrics tracker into the loop described in the build prompt (section 11). The LLM is
kept out of the hot path: real/mock rendering happens only every ``render_every`` iters.
"""

from __future__ import annotations

import argparse
import random
import sys
import time
from typing import Optional

from app.bandit.candidate_sampler import CandidateSampler
from app.bandit.vw_policy import VWPolicy
from app.config import Config, load_config
from app.environment.ground_truth import GroundTruth
from app.environment.prospects import ProspectStream
from app.environment.simulator import Simulator
from app.metrics.tracker import Tracker
from app.planes.guardrails import Guardrails
from app.planes.outcomes import Outcomes, objective


class SimulationEngine:
    """Owns all run state. Step-able so the API can drive it in the background."""

    def __init__(self, cfg: Config, tracker: Optional[Tracker] = None, renderer=None):
        self.cfg = cfg
        s = cfg.simulation.seed
        self.gt = GroundTruth()
        self.sim = Simulator(cfg, self.gt, random.Random(s))
        self.stream = ProspectStream(
            random.Random(s + 1), holdout_fraction=cfg.holdout.fraction
        )
        self.sampler = CandidateSampler(random.Random(s + 2))
        self.policy = VWPolicy(cfg.bandit, seed=s + 3)
        self.guardrails = Guardrails(cfg.guardrails)
        self.holdout_rng = random.Random(s + 4)
        self.tracker = tracker or Tracker()
        self.renderer = renderer
        self.t = 0
        self.K = cfg.simulation.candidates_per_decision

    def step(self) -> None:
        cfg = self.cfg
        # Find an eligible prospect + non-empty candidate set. A real sender skips
        # blocked/capped contacts and serves the next eligible one rather than wasting
        # the slot, so we retry with fresh prospects a bounded number of times.
        p = None
        candidates: list = []
        for attempt in range(8):
            cand = self.stream.next() if attempt == 0 else self.stream.force_new()
            if self.guardrails.permanently_blocked(cand):
                self.stream.retire(cand)
                continue
            cands = self.guardrails.filter(self.sampler.sample(cand.context, self.K), cand)
            if cands:
                p, candidates = cand, cands
                break
        if p is None:
            self.tracker.note_skip()
            return
        ctx = p.context

        if p.is_holdout:
            idx = self.holdout_rng.randrange(len(candidates))
            prob = 1.0 / len(candidates)
        else:
            idx, prob = self.policy.predict(ctx, candidates)
        recipe = candidates[idx]

        self.guardrails.note_send(p)
        outcomes: Outcomes = self.sim.run(recipe, ctx)
        decay = self.sim.deliverability_decay
        score = objective(outcomes, ctx.intent, cfg.objective, decay)

        if not p.is_holdout:
            self.policy.learn(ctx, candidates, idx, -score, prob)

        self.guardrails.note_outcome(p, outcomes)
        self.tracker.record(p, recipe, outcomes, score, prob, p.is_holdout, decay)
        self.stream.update_sequence_state(p, outcomes)

        self.t += 1
        if (
            self.renderer is not None
            and cfg.simulation.render_every
            and self.t % cfg.simulation.render_every == 0
            and not p.is_holdout
        ):
            email = self.renderer.render(recipe, ctx)
            self.tracker.attach_rendered_email(self.t, ctx, recipe, email)
        if cfg.simulation.iters_per_day and self.t % cfg.simulation.iters_per_day == 0:
            self.guardrails.advance_day()

    def run(self, n: int, progress_every: int = 0) -> Tracker:
        start = time.time()
        for i in range(n):
            self.step()
            if progress_every and (i + 1) % progress_every == 0:
                snap = self.tracker.lift()
                rate = (i + 1) / max(1e-9, time.time() - start)
                print(
                    f"[{i + 1:>7}/{n}] bandit={snap['bandit_mean']:+.4f} "
                    f"holdout={snap['holdout_mean']:+.4f} lift={snap['lift']:+.4f} "
                    f"(±{snap['ci95']:.4f}) decay={self.tracker.last_decay:.3f} "
                    f"skipped={self.tracker.skipped} {rate:,.0f} it/s"
                )
        return self.tracker


def build_engine(cfg: Config) -> SimulationEngine:
    renderer = None
    if cfg.rendering.provider == "mock":
        try:
            from app.rendering.mock_renderer import MockRenderer
            renderer = MockRenderer()
        except Exception:
            renderer = None
    elif cfg.rendering.provider == "anthropic":
        try:
            from app.rendering.llm_renderer import AnthropicRenderer
            renderer = AnthropicRenderer(cfg.rendering)
        except Exception as e:  # missing key / package -> skip rendering, keep learning
            print(f"(renderer disabled: {e})")
            renderer = None
    return SimulationEngine(cfg, renderer=renderer)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Cold email bandit — headless learning loop")
    parser.add_argument("--config", default=None, help="Path to config.yaml")
    parser.add_argument("-n", "--iterations", type=int, default=None)
    parser.add_argument("--exploration", choices=["epsilon", "squarecb", "cover"], default=None)
    parser.add_argument("--seed", type=int, default=None)
    parser.add_argument("--save", default=None, help="Save the trained VW model to this path")
    parser.add_argument("--charts", action="store_true", help="Write PNG charts at the end")
    args = parser.parse_args(argv)

    cfg = load_config(args.config)
    if args.iterations is not None:
        cfg.simulation.n_iterations = args.iterations
    if args.exploration is not None:
        cfg.bandit.exploration = args.exploration
    if args.seed is not None:
        cfg.simulation.seed = args.seed

    n = cfg.simulation.n_iterations
    print(f"Running {n} iterations | exploration={cfg.bandit.exploration} "
          f"| K={cfg.simulation.candidates_per_decision} | holdout={cfg.holdout.fraction}")
    engine = build_engine(cfg)
    engine.run(n, progress_every=max(1, n // 20))

    snap = engine.tracker.snapshot()
    print("\n=== Final ===")
    print(f"bandit mean   : {snap['lift']['bandit_mean']:+.4f} (n={snap['lift']['bandit_n']})")
    print(f"holdout mean  : {snap['lift']['holdout_mean']:+.4f} (n={snap['lift']['holdout_n']})")
    print(f"policy lift   : {snap['lift']['lift']:+.4f} ± {snap['lift']['ci95']:.4f} "
          f"({'significant' if snap['lift']['significant'] else 'not significant'})")
    print(f"domain decay  : {snap['domain_decay']:.3f}")
    print(f"skipped sends : {snap['skipped']}")

    if args.save:
        engine.policy.save(args.save)
        print(f"saved model -> {args.save}")
    if args.charts:
        try:
            from app.dashboard.cli_charts import write_charts
            paths = write_charts(engine.tracker)
            print("charts:", ", ".join(paths))
        except Exception as e:
            print(f"(charts skipped: {e})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
