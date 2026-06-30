"""Rolling metrics: learning curve, bandit-vs-holdout lift, and the outcome funnel.

This is the live "stat counter." It keeps cheap aggregates (cumulative sums + bounded
rolling windows) so it can run inside a tens-of-thousands-iteration loop without growing
unbounded. Per-context lever tables and the recovery check live in their own modules
(M4) and read the policy + ground truth directly.
"""

from __future__ import annotations

import math
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Optional

from app.planes.context import Context
from app.planes.features import Recipe
from app.planes.outcomes import Outcomes


@dataclass
class _Stream:
    """Running stats for one cohort (bandit or holdout)."""

    n: int = 0
    total: float = 0.0
    sumsq: float = 0.0
    window: deque = field(default_factory=lambda: deque(maxlen=2000))

    def add(self, score: float) -> None:
        self.n += 1
        self.total += score
        self.sumsq += score * score
        self.window.append(score)

    @property
    def mean(self) -> float:
        return self.total / self.n if self.n else 0.0

    @property
    def rolling_mean(self) -> float:
        return sum(self.window) / len(self.window) if self.window else 0.0

    def variance(self) -> float:
        if self.n < 2:
            return 0.0
        return max(0.0, (self.sumsq - self.total**2 / self.n) / (self.n - 1))


class Tracker:
    def __init__(self, window: int = 2000, curve_every: int = 250):
        self.window = window
        self.curve_every = curve_every
        self.t = 0
        self.bandit = _Stream(window=deque(maxlen=window))
        self.holdout = _Stream(window=deque(maxlen=window))
        self.skipped = 0
        # bandit-cohort funnel counts
        self.funnel = {
            k: 0 for k in (
                "sends", "delivered", "primary", "promotions", "spam", "opened",
                "clicked", "replied", "positive", "meeting", "unsubscribe",
                "spam_complaint", "negative_reply",
            )
        }
        self.curve: list[dict[str, float]] = []
        self.last_decay = 0.0
        self.rendered: list[dict[str, Any]] = []

    def note_skip(self) -> None:
        self.skipped += 1

    def record(
        self,
        prospect: Any,
        recipe: Recipe,
        outcomes: Outcomes,
        score: float,
        propensity: float,
        is_holdout: bool,
        deliverability_decay: float,
    ) -> None:
        self.t += 1
        self.last_decay = deliverability_decay
        if is_holdout:
            self.holdout.add(score)
        else:
            self.bandit.add(score)
            f = self.funnel
            f["sends"] += 1
            f["delivered"] += outcomes.delivered
            if outcomes.delivered:
                f[outcomes.placement] = f.get(outcomes.placement, 0) + 1
            f["opened"] += outcomes.opened
            f["clicked"] += outcomes.clicked
            f["replied"] += outcomes.replied
            f["positive"] += outcomes.replied_positive
            f["meeting"] += outcomes.meeting_booked
            f["unsubscribe"] += outcomes.unsubscribe
            f["spam_complaint"] += outcomes.spam_complaint
            f["negative_reply"] += outcomes.negative_reply

        if self.t % self.curve_every == 0:
            self.curve.append(
                {
                    "t": self.t,
                    "bandit_rolling": self.bandit.rolling_mean,
                    "holdout_rolling": self.holdout.rolling_mean,
                    "bandit_mean": self.bandit.mean,
                    "holdout_mean": self.holdout.mean,
                    "domain_decay": deliverability_decay,
                }
            )

    def attach_rendered_email(self, t: int, context: Context, recipe: Recipe, email: dict) -> None:
        self.rendered.append(
            {"t": t, "context": context.as_dict(), "recipe": recipe.as_dict(), "email": email}
        )

    # ------------------------------------------------------------------- summary --
    def lift(self) -> dict[str, float]:
        """Policy lift = mean bandit score - mean holdout score, with a 95% CI half-width."""
        b, h = self.bandit, self.holdout
        diff = b.mean - h.mean
        se = math.sqrt(
            (b.variance() / b.n if b.n else 0.0) + (h.variance() / h.n if h.n else 0.0)
        )
        return {
            "bandit_mean": b.mean,
            "holdout_mean": h.mean,
            "lift": diff,
            "ci95": 1.96 * se,
            "significant": diff > 1.96 * se and b.n > 30 and h.n > 30,
            "bandit_n": b.n,
            "holdout_n": h.n,
        }

    def funnel_rates(self) -> dict[str, float]:
        sends = self.funnel["sends"] or 1
        return {k: v / sends for k, v in self.funnel.items() if k != "sends"} | {"sends": self.funnel["sends"]}

    def snapshot(self) -> dict[str, Any]:
        return {
            "t": self.t,
            "skipped": self.skipped,
            "lift": self.lift(),
            "funnel": self.funnel_rates(),
            "domain_decay": self.last_decay,
            "rolling_bandit": self.bandit.rolling_mean,
            "rolling_holdout": self.holdout.rolling_mean,
        }
