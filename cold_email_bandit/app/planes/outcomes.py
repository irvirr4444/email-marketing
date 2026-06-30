"""Plane 4 — OUTCOMES and the objective function.

The objective is the ONLY signal the bandit optimizes. It deliberately is *not* raw
conversion: complaints and unsubscribes carry heavy penalties, and a running
deliverability-decay term makes a domain-burning policy score worse than a calmer one.

VW minimizes cost, so callers feed ``cost = -score``.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from app.config import ObjectiveWeights
from app.planes.context import Intent


@dataclass
class Outcomes:
    """Realized (simulated) outcomes for one send. Timestamps are seconds-from-send."""

    delivered: bool = False
    placement: str = "primary"           # primary | promotions | spam
    opened: bool = False
    time_to_open: Optional[float] = None
    clicked: bool = False
    replied: bool = False
    reply_sentiment: Optional[str] = None  # positive | neutral | negative
    meeting_booked: bool = False
    unsubscribe: bool = False
    spam_complaint: bool = False
    hard_block: bool = False
    negative_reply: bool = False
    timestamps: dict[str, float] = field(default_factory=dict)

    # --- convenience flags used by the objective ----------------------------------
    @property
    def replied_positive(self) -> bool:
        return self.replied and self.reply_sentiment == "positive"

    def as_dict(self) -> dict[str, Any]:
        return {
            "delivered": self.delivered,
            "placement": self.placement,
            "opened": self.opened,
            "time_to_open": self.time_to_open,
            "clicked": self.clicked,
            "replied": self.replied,
            "reply_sentiment": self.reply_sentiment,
            "meeting_booked": self.meeting_booked,
            "unsubscribe": self.unsubscribe,
            "spam_complaint": self.spam_complaint,
            "hard_block": self.hard_block,
            "negative_reply": self.negative_reply,
        }


def objective(
    outcomes: Outcomes,
    intent: Intent,
    weights: ObjectiveWeights,
    deliverability_decay: float = 0.0,
) -> float:
    """Composite score for a single send.

    ``deliverability_decay`` is the *current* domain-health erosion (0..1+) at send
    time; complaints accumulate it over a run and it taxes every subsequent send.
    """
    conversion_value = (
        weights.w_reply * float(outcomes.replied_positive)
        + weights.w_click * float(outcomes.clicked)
    )
    if intent == Intent.BOOK_MEETING:
        conversion_value += weights.w_meeting * float(outcomes.meeting_booked)

    penalty = (
        weights.w_unsub * float(outcomes.unsubscribe)
        + weights.w_complaint * float(outcomes.spam_complaint)
        + weights.w_negreply * float(outcomes.negative_reply)
        + weights.w_deliv_decay * float(deliverability_decay)
    )
    return conversion_value - penalty


def cost(
    outcomes: Outcomes,
    intent: Intent,
    weights: ObjectiveWeights,
    deliverability_decay: float = 0.0,
) -> float:
    """VW cost = -score (VW minimizes)."""
    return -objective(outcomes, intent, weights, deliverability_decay)
