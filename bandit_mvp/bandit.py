"""Thin wrapper over Vowpal Wabbit's cb_explore_adf. No email concepts leak in here.

The policy chooses among feature-described candidate arms, so it generalizes across the
astronomically large lever space it never fully sees. The propensity returned by ``pick``
is the probability the exploration policy assigned to the chosen action and MUST be logged
at send time. That logged propensity is what makes off-policy evaluation correct on real
logs later.
"""

from __future__ import annotations

import random
from pathlib import Path

import vowpalwabbit as vw

from levers import action_line, context_line

# The -q CA crossing is required so the policy learns "this lever value is good IN THIS
# context" rather than a context-free average. Kept verbatim per the build spec.
VW_ARGS = "--cb_explore_adf -q CA --interactions CA --epsilon 0.1 --quiet"


class Bandit:
    def __init__(self, seed: int = 0, init_regressor: str | None = None):
        self.rng = random.Random(seed)
        self._args = VW_ARGS
        args = VW_ARGS + (f" -i {init_regressor}" if init_regressor else "")
        self.ws = vw.Workspace(args)

    # ------------------------------------------------------------------ encoding --
    @staticmethod
    def _example(
        ctx: dict[str, str],
        recipes: list[dict[str, str]],
        chosen: int | None = None,
        cost: float | None = None,
        probability: float | None = None,
    ) -> list[str]:
        lines = [context_line(ctx)]
        for i, recipe in enumerate(recipes):
            line = action_line(recipe)
            if chosen is not None and i == chosen:
                # "<chosen>:<cost>:<probability>" prepended to the chosen action's line.
                # VW keys the update off the labelled line's position; cost is minimized
                # and probability is the logged propensity used for the unbiased update.
                line = f"{i}:{cost}:{probability} {line}"
            lines.append(line)
        return lines

    def _pmf(self, ctx: dict[str, str], recipes: list[dict[str, str]]) -> list[float]:
        ex = self.ws.parse(self._example(ctx, recipes))
        try:
            return list(self.ws.predict(ex))
        finally:
            self.ws.finish_example(ex)

    def _sample(self, pmf: list[float]) -> int:
        total = sum(pmf)
        x = self.rng.random() * (total if total > 0 else 1.0)
        cum = 0.0
        for i, p in enumerate(pmf):
            cum += p
            if x <= cum:
                return i
        return len(pmf) - 1

    # ------------------------------------------------------------- pick / learn --
    def pick(self, ctx: dict[str, str], recipes: list[dict[str, str]]) -> tuple[int, float, list[float]]:
        """Sample an action from the exploration distribution.

        Returns ``(chosen_index, probability, all_probs)``. ``probability`` is the
        propensity of the chosen action and MUST be logged.
        """
        pmf = self._pmf(ctx, recipes)
        idx = self._sample(pmf)
        return idx, pmf[idx], pmf

    def learn(
        self,
        ctx: dict[str, str],
        recipes: list[dict[str, str]],
        chosen: int,
        probability: float,
        reward: float,
    ) -> None:
        cost = -reward  # VW minimizes cost
        ex = self.ws.parse(self._example(ctx, recipes, chosen, cost, probability))
        try:
            self.ws.learn(ex)
        finally:
            self.ws.finish_example(ex)

    def greedy_scores(self, ctx: dict[str, str], recipes: list[dict[str, str]]) -> list[float]:
        """The exploitation view (full PMF) used by the recovery check / eval."""
        return self._pmf(ctx, recipes)

    def greedy_best(self, ctx: dict[str, str], recipes: list[dict[str, str]]) -> int:
        pmf = self._pmf(ctx, recipes)
        return max(range(len(pmf)), key=lambda i: pmf[i])

    # ------------------------------------------------------------------- io -------
    def save(self, path: str | Path) -> None:
        self.ws.save(str(path))

    def finish(self) -> None:
        try:
            self.ws.finish()
        except Exception:
            pass


if __name__ == "__main__":
    # Tiny sanity check: predict on a hand-built 2-action example to confirm VW runs.
    b = Bandit(seed=1)
    ctx = {"segment": "cold_prospect", "intent": "drive_purchase", "industry": "ecommerce", "seniority": "manager"}
    recipes = [
        {k: v[0] for k, v in __import__("levers").LEVERS.items()},
        {k: v[-1] for k, v in __import__("levers").LEVERS.items()},
    ]
    idx, prob, pmf = b.pick(ctx, recipes)
    print("pmf:", [round(p, 3) for p in pmf])
    print("chosen:", idx, "propensity:", round(prob, 3))
    b.learn(ctx, recipes, idx, prob, reward=1.0)
    print("learn ok")
    b.finish()
