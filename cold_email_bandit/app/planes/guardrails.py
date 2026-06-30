"""Plane 6 — GUARDRAILS: hard constraints applied pre-send. Never learned from.

Guardrails *prune the action set* and gate whole sends; they never enter the cost.
That separation is deliberate: the bandit must not be able to learn its way around a
compliance or frequency rule. If guardrails empty the candidate set, the send is
skipped entirely.
"""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Any, Iterable, Protocol

from app.config import GuardrailsConfig
from app.planes.features import Recipe


class _HasContext(Protocol):
    id: Any
    context: Any


@dataclass
class _ContactState:
    sends_today: int = 0
    sends_week: deque = field(default_factory=lambda: deque(maxlen=7))  # per-day counts
    consecutive_nonengagements: int = 0
    unsubscribed: bool = False
    complained: bool = False
    paused: bool = False  # sequence paused (objection / cooldown / negative event)

    def week_total(self) -> int:
        return self.sends_today + sum(self.sends_week)


class Guardrails:
    """Stateful guardrail engine for a single run.

    Lifecycle per send:
      1. ``filter(candidates, prospect)`` -> pruned candidate list (may be empty).
      2. caller sends iff list non-empty, then ``note_send(prospect)``.
      3. ``note_outcome(prospect, outcomes)`` updates suppression / pause / complaint state.
    Day boundaries are advanced explicitly with ``advance_day()``.
    """

    def __init__(self, cfg: GuardrailsConfig, suppression_list: Iterable[Any] | None = None):
        self.cfg = cfg
        self._states: dict[Any, _ContactState] = {}
        self._suppressed: set[Any] = set(suppression_list or [])
        self._total_sends: int = 0
        self._total_complaints: int = 0
        self._sends_today_run: int = 0
        self._run_paused: bool = False

    # --- state access -------------------------------------------------------------
    def _state(self, pid: Any) -> _ContactState:
        st = self._states.get(pid)
        if st is None:
            st = _ContactState()
            self._states[pid] = st
        return st

    def suppress(self, pid: Any) -> None:
        self._suppressed.add(pid)

    def complaint_rate(self) -> float:
        return self._total_complaints / self._total_sends if self._total_sends else 0.0

    @property
    def run_paused(self) -> bool:
        return self._run_paused

    # --- gating -------------------------------------------------------------------
    def should_send(self, prospect: _HasContext) -> bool:
        if self._run_paused:
            return False
        if self._sends_today_run >= self.cfg.max_sends_per_day_run:
            return False  # run-level cancellation threshold
        pid = prospect.id
        if pid in self._suppressed:
            return False
        st = self._state(pid)
        if st.unsubscribed or st.paused:
            return False
        if st.sends_today >= self.cfg.max_per_contact_per_day:
            return False
        if st.week_total() >= self.cfg.max_per_contact_per_week:
            return False
        return True

    def is_allowed(self, recipe: Recipe, prospect: _HasContext) -> bool:
        """Recipe-level compliance/brand bans from config.banned_lever_values."""
        banned = self.cfg.banned_lever_values
        if not banned:
            return True
        tokens = recipe.feature_tokens()
        for dim, bad_values in banned.items():
            val = tokens.get(dim)
            if val is None:
                continue
            if val in {str(v).lower() for v in bad_values}:
                return False
        return True

    def filter(self, candidates: list[Recipe], prospect: _HasContext) -> list[Recipe]:
        if not self.should_send(prospect):
            return []
        return [c for c in candidates if self.is_allowed(c, prospect)]

    def permanently_blocked(self, prospect: _HasContext) -> bool:
        """True if this prospect can never be sent to again (vs merely freq-capped today)."""
        if self._run_paused:
            return True
        if prospect.id in self._suppressed:
            return True
        st = self._state(prospect.id)
        return st.unsubscribed or st.paused

    # --- bookkeeping --------------------------------------------------------------
    def note_send(self, prospect: _HasContext) -> None:
        st = self._state(prospect.id)
        st.sends_today += 1
        self._total_sends += 1
        self._sends_today_run += 1

    def note_outcome(self, prospect: _HasContext, outcomes: Any) -> None:
        st = self._state(prospect.id)
        if getattr(outcomes, "unsubscribe", False):
            st.unsubscribed = True
            st.paused = True
        if getattr(outcomes, "spam_complaint", False):
            st.complained = True
            st.paused = True
            self._total_complaints += 1
            if self.complaint_rate() > self.cfg.complaint_rate_ceiling:
                self._run_paused = True
        if getattr(outcomes, "hard_block", False):
            st.paused = True
        if getattr(outcomes, "negative_reply", False):
            st.paused = True  # auto-pause on objection
        engaged = (
            getattr(outcomes, "opened", False)
            or getattr(outcomes, "clicked", False)
            or getattr(outcomes, "replied", False)
        )
        if engaged:
            st.consecutive_nonengagements = 0
        else:
            st.consecutive_nonengagements += 1
            if st.consecutive_nonengagements >= self.cfg.cooldown_after_n_nonengage:
                st.paused = True

    def advance_day(self) -> None:
        """Roll the daily counters; the run calls this at logical day boundaries."""
        for st in self._states.values():
            st.sends_week.append(st.sends_today)
            st.sends_today = 0
        self._sends_today_run = 0
