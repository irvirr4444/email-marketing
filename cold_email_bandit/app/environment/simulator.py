"""Outcome simulator: turns a (recipe, context) into stochastic ``Outcomes``.

Runs the funnel chain delivered -> placement -> open -> click -> reply -> sentiment ->
meeting, plus negative events, using ground-truth logits with per-draw Gaussian noise.
Maintains a running ``domain_health`` that complaints erode (Plane 3/4 deliverability
decay), which then gates everyone's placement for the rest of the run.
"""

from __future__ import annotations

import random

from app.config import Config
from app.environment.ground_truth import P_DELIVERED, GroundTruth, sigmoid
from app.planes import deliverability
from app.planes.context import Context, Intent
from app.planes.features import Recipe
from app.planes.outcomes import Outcomes


class Simulator:
    def __init__(self, cfg: Config, ground_truth: GroundTruth, rng: random.Random):
        self.cfg = cfg
        self.gt = ground_truth
        self.rng = rng
        self.domain_health = 1.0

    @property
    def deliverability_decay(self) -> float:
        """Current decay in [0, 1]; what the objective taxes each send by."""
        return 1.0 - self.domain_health

    def _noise(self) -> float:
        return self.rng.gauss(0.0, self.gt.noise_sigma)

    def run(self, recipe: Recipe, context: Context) -> Outcomes:
        out = Outcomes()
        deliv = self.cfg.deliverability

        # 1. delivered?
        if self.rng.random() > P_DELIVERED:
            out.delivered = False
            out.hard_block = self.rng.random() < 0.35
            return out
        out.delivered = True
        out.timestamps["sent"] = 0.0

        # 2. placement (gated by current domain health)
        dist = deliverability.placement_distribution(recipe, deliv, self.domain_health)
        out.placement = self._choose_placement(dist)
        vis = deliverability.open_multiplier(out.placement, deliv)

        L = self.gt.logits(recipe, context)

        # 3. open
        open_p = sigmoid(L["open"] + self._noise()) * vis
        if self.rng.random() < open_p:
            out.opened = True
            out.time_to_open = round(self.rng.expovariate(1 / 6.0), 2)  # ~hours
            out.timestamps["opened"] = out.time_to_open

            # 4. click (independent of reply, both conditional on open)
            if self.rng.random() < sigmoid(L["click"] + self._noise()):
                out.clicked = True
                out.timestamps["clicked"] = out.time_to_open + 0.1

            # 5. reply + sentiment
            if self.rng.random() < sigmoid(L["reply"] + self._noise()):
                out.replied = True
                out.timestamps["replied"] = out.time_to_open + self.rng.uniform(0.5, 24)
                if self.rng.random() < sigmoid(L["pos"] + self._noise()):
                    out.reply_sentiment = "positive"
                    if context.intent == Intent.BOOK_MEETING and self.rng.random() < sigmoid(
                        L["meeting"] + self._noise()
                    ):
                        out.meeting_booked = True
                        out.timestamps["meeting"] = out.timestamps["replied"] + 24
                elif self.rng.random() < sigmoid(L["negsent"] + self._noise()):
                    out.reply_sentiment = "negative"
                    out.negative_reply = True
                else:
                    out.reply_sentiment = "neutral"

        # 6. negative events (conditional on delivered + visibility)
        if self.rng.random() < sigmoid(L["unsub"] + self._noise()) * vis:
            out.unsubscribe = True
        if self.rng.random() < sigmoid(L["complaint"] + self._noise()) * vis:
            out.spam_complaint = True
            self._erode_domain(deliv.decay_per_complaint)

        # Domain health recovers toward 1.0 proportionally, so decay settles at an
        # equilibrium set by the CURRENT complaint rate rather than growing forever.
        # A calmer (learned) policy therefore lifts everyone's deliverability back up.
        if deliv.health_recovery_per_iter:
            self.domain_health = min(
                1.0,
                self.domain_health + deliv.health_recovery_per_iter * (1.0 - self.domain_health),
            )
        return out

    def _choose_placement(self, dist: dict[str, float]) -> str:
        x = self.rng.random()
        cum = 0.0
        for placement, p in dist.items():
            cum += p
            if x <= cum:
                return placement
        return "primary"

    def _erode_domain(self, amount: float) -> None:
        self.domain_health = max(0.0, self.domain_health - amount)
