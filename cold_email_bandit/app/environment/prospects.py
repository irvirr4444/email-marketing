"""Synthetic prospect/context stream with sequence state.

Emits a stream of sends. Each prospect runs a multi-touch sequence, so ``email_2`` for
a prospect carries the ``prior_outcome`` produced by ``email_1``. This is what gives the
bandit sequence-position interactions to learn.
"""

from __future__ import annotations

import itertools
import random
from dataclasses import dataclass, field

from app.planes.context import (
    CompanySize,
    Context,
    Department,
    GeoTimezone,
    Industry,
    Intent,
    PriorOutcome,
    RoleSeniority,
    SequencePosition,
)
from app.planes.outcomes import Outcomes

_SEQ_BY_IDX = [
    SequencePosition.EMAIL_1,
    SequencePosition.EMAIL_2,
    SequencePosition.EMAIL_3,
    SequencePosition.EMAIL_4PLUS,
    SequencePosition.BREAKUP,
]

# Realistic-ish cold-outreach context distribution (weights need not sum to 1).
_INDUSTRY_W = {
    Industry.SAAS: 0.26, Industry.ECOMMERCE: 0.14, Industry.AGENCY: 0.12,
    Industry.FINANCE: 0.12, Industry.HEALTHCARE: 0.10, Industry.REAL_ESTATE: 0.08,
    Industry.EDUCATION: 0.06, Industry.MANUFACTURING: 0.07, Industry.OTHER: 0.05,
}
_SIZE_W = {CompanySize.SMB: 0.5, CompanySize.MID: 0.35, CompanySize.ENTERPRISE: 0.15}
_ROLE_W = {
    RoleSeniority.IC: 0.20, RoleSeniority.MANAGER: 0.28, RoleSeniority.DIRECTOR: 0.24,
    RoleSeniority.VP: 0.16, RoleSeniority.C_LEVEL: 0.12,
}
_DEPT_W = {
    Department.SALES: 0.26, Department.MARKETING: 0.22, Department.ENGINEERING: 0.16,
    Department.OPS: 0.14, Department.FINANCE: 0.10, Department.FOUNDER: 0.12,
}
_TZ_W = {
    GeoTimezone.US_EASTERN: 0.34, GeoTimezone.US_CENTRAL: 0.16, GeoTimezone.US_PACIFIC: 0.22,
    GeoTimezone.EMEA: 0.18, GeoTimezone.APAC: 0.10,
}


def _weighted(rng: random.Random, weights: dict):
    keys = list(weights.keys())
    cum, total, x = 0.0, sum(weights.values()), rng.random()
    for k in keys:
        cum += weights[k] / total
        if x <= cum:
            return k
    return keys[-1]


@dataclass
class Prospect:
    id: str
    industry: Industry
    company_size: CompanySize
    role_seniority: RoleSeniority
    department: Department
    geo_timezone: GeoTimezone
    intent: Intent
    seq_idx: int = 0
    prior_outcome: PriorOutcome = PriorOutcome.NONE
    days_since_previous: int = 0
    lifetime_emails_received: int = 0
    done: bool = False
    is_holdout: bool = False

    @property
    def context(self) -> Context:
        return Context(
            industry=self.industry,
            company_size=self.company_size,
            role_seniority=self.role_seniority,
            department=self.department,
            geo_timezone=self.geo_timezone,
            sequence_position=_SEQ_BY_IDX[min(self.seq_idx, len(_SEQ_BY_IDX) - 1)],
            prior_outcome=self.prior_outcome,
            intent=self.intent,
            days_since_previous=self.days_since_previous,
            lifetime_emails_received=self.lifetime_emails_received,
        )


class ProspectStream:
    def __init__(
        self,
        rng: random.Random,
        p_new: float = 0.45,
        max_active: int = 400,
        holdout_fraction: float = 0.0,
    ):
        self.rng = rng
        self.p_new = p_new
        self.max_active = max_active
        self.holdout_fraction = holdout_fraction
        self._active: list[Prospect] = []
        self._ids = itertools.count(1)

    def _new_prospect(self) -> Prospect:
        return Prospect(
            id=f"p{next(self._ids)}",
            industry=_weighted(self.rng, _INDUSTRY_W),
            company_size=_weighted(self.rng, _SIZE_W),
            role_seniority=_weighted(self.rng, _ROLE_W),
            department=_weighted(self.rng, _DEPT_W),
            geo_timezone=_weighted(self.rng, _TZ_W),
            intent=self.rng.choice([Intent.BOOK_MEETING, Intent.GET_REPLY]),
            is_holdout=self.rng.random() < self.holdout_fraction,
        )

    def next(self) -> Prospect:
        if not self._active or len(self._active) < self.max_active and self.rng.random() < self.p_new:
            return self.force_new()
        return self.rng.choice(self._active)

    def force_new(self) -> Prospect:
        """Create and return a brand-new prospect (used to fill a freed-up send slot)."""
        p = self._new_prospect()
        self._active.append(p)
        return p

    def update_sequence_state(self, prospect: Prospect, outcomes: Outcomes) -> None:
        prospect.lifetime_emails_received += 1

        # carry prior_outcome forward for the next touch
        if outcomes.replied:
            prospect.prior_outcome = PriorOutcome.OPENED_NO_REPLY  # replied -> sequence ends below
        elif outcomes.clicked:
            prospect.prior_outcome = PriorOutcome.CLICKED_NO_REPLY
        elif outcomes.opened:
            prospect.prior_outcome = PriorOutcome.OPENED_NO_REPLY
        else:
            prospect.prior_outcome = PriorOutcome.DIDNT_OPEN

        ends = (
            outcomes.replied
            or outcomes.meeting_booked
            or outcomes.unsubscribe
            or outcomes.spam_complaint
            or outcomes.hard_block
            or prospect.context.sequence_position == SequencePosition.BREAKUP
        )
        if ends:
            prospect.done = True
            self._remove(prospect)
            return

        prospect.seq_idx = min(prospect.seq_idx + 1, len(_SEQ_BY_IDX) - 1)
        prospect.days_since_previous = self.rng.randint(2, 6)

    def retire(self, prospect: Prospect) -> None:
        """Drop a prospect from the active pool (permanently blocked / sequence over)."""
        prospect.done = True
        self._remove(prospect)

    def _remove(self, prospect: Prospect) -> None:
        try:
            self._active.remove(prospect)
        except ValueError:
            pass
