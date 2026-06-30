"""Vowpal Wabbit CB-ADF policy wrapper: predict / learn / save / load.

The policy chooses among feature-described candidate arms, so it generalizes across the
~10^11 lever combinations it never sees. Exploration algorithm is a config knob
(epsilon-greedy, SquareCB, or cover); the propensity returned by ``predict`` is the
probability the exploration policy assigned to the chosen action and MUST be logged for
unbiased learning and off-policy evaluation.
"""

from __future__ import annotations

import math
import random
from pathlib import Path

import vowpalwabbit as vw

from app.bandit.encoding import build_examples
from app.config import BanditConfig
from app.planes.context import Context
from app.planes.features import Recipe


class VWPolicy:
    def __init__(self, cfg: BanditConfig, seed: int = 0):
        self.cfg = cfg
        self.rng = random.Random(seed)
        self._t = 0  # decision counter (drives optional epsilon decay)
        self.ws = vw.Workspace(self._init_string())

    # ------------------------------------------------------------------ init ------
    def _init_string(self, initial_regressor: str | None = None) -> str:
        c = self.cfg
        parts = ["--cb_explore_adf"]
        if c.exploration == "epsilon":
            # when decaying we drive epsilon ourselves in Python, so keep VW greedy
            parts += ["--epsilon", "0.0" if c.epsilon_decay else str(c.epsilon)]
        elif c.exploration == "squarecb":
            parts += ["--squarecb", "--gamma_scale", str(c.gamma_scale),
                      "--gamma_exponent", str(c.gamma_exponent)]
        elif c.exploration == "cover":
            parts += ["--cover", str(c.cover)]
        for q in c.quadratic:
            parts += ["-q", q]
        for inter in c.interactions:
            parts += ["--interactions", inter]
        parts += ["--cb_type", c.cb_type]
        parts += ["--learning_rate", str(c.learning_rate), "--power_t", str(c.power_t)]
        if initial_regressor:
            parts += ["-i", initial_regressor]
        parts += ["--quiet"]
        return " ".join(parts)

    # --------------------------------------------------------------- exploration --
    def current_epsilon(self) -> float:
        if not (self.cfg.exploration == "epsilon" and self.cfg.epsilon_decay):
            return self.cfg.epsilon if self.cfg.exploration == "epsilon" else 0.0
        # inverse-sqrt decay toward the floor
        eps = self.cfg.epsilon / math.sqrt(1.0 + self._t / 1000.0)
        return max(self.cfg.epsilon_decay_floor, eps)

    def _pmf(self, context: Context, candidates: list[Recipe]) -> list[float]:
        lines = build_examples(context, candidates)
        ex = self.ws.parse(lines)
        try:
            pmf = list(self.ws.predict(ex))
        finally:
            self.ws.finish_example(ex)
        # Python-side epsilon decay layer (only active in epsilon+decay mode)
        if self.cfg.exploration == "epsilon" and self.cfg.epsilon_decay:
            k = len(pmf)
            greedy = max(range(k), key=lambda i: pmf[i])
            eps = self.current_epsilon()
            pmf = [eps / k] * k
            pmf[greedy] += 1.0 - eps
        return pmf

    # ------------------------------------------------------------- predict/learn --
    def predict(self, context: Context, candidates: list[Recipe]) -> tuple[int, float]:
        """Sample an action from the exploration PMF. Returns (chosen_idx, propensity)."""
        pmf = self._pmf(context, candidates)
        idx = self._sample(pmf)
        self._t += 1
        return idx, pmf[idx]

    def best(self, context: Context, candidates: list[Recipe]) -> int:
        """Greedy argmax (no exploration) — used by the recovery check."""
        pmf = self._pmf(context, candidates)
        return max(range(len(pmf)), key=lambda i: pmf[i])

    def learn(
        self,
        context: Context,
        candidates: list[Recipe],
        chosen_idx: int,
        cost: float,
        propensity: float,
    ) -> None:
        lines = build_examples(context, candidates, chosen_idx, cost, propensity)
        ex = self.ws.parse(lines)
        try:
            self.ws.learn(ex)
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

    # ------------------------------------------------------------------ io --------
    def save(self, path: str | Path) -> None:
        self.ws.save(str(path))

    def load(self, path: str | Path) -> None:
        self.ws.finish()
        self.ws = vw.Workspace(self._init_string(initial_regressor=str(path)))

    def finish(self) -> None:
        try:
            self.ws.finish()
        except Exception:
            pass
