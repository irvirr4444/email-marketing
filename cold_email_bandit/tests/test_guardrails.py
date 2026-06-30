"""Plane 6 guardrail unit tests."""

from dataclasses import dataclass
from typing import Any

import pytest

from app.config import GuardrailsConfig
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
from app.planes.features import (
    BodyLength,
    CtaCount,
    CtaPlacement,
    CtaType,
    Format,
    Framework,
    Emotion,
    LinkCount,
    Offer,
    Persuasion,
    Preheader,
    ReadingGrade,
    Recipe,
    SenderType,
    Specificity,
    PersonalizationDepth,
    SubjectCase,
    SubjectLength,
    SubjectPersonalization,
    SubjectType,
    SendDaypart,
)
from app.planes.guardrails import Guardrails
from app.planes.outcomes import Outcomes


@dataclass
class _Prospect:
    id: Any
    context: Context


def _ctx() -> Context:
    return Context(
        industry=Industry.SAAS,
        company_size=CompanySize.MID,
        role_seniority=RoleSeniority.VP,
        department=Department.SALES,
        geo_timezone=GeoTimezone.US_EASTERN,
        sequence_position=SequencePosition.EMAIL_1,
        prior_outcome=PriorOutcome.NONE,
        intent=Intent.GET_REPLY,
    )


def _recipe(**overrides) -> Recipe:
    base = dict(
        subject_type=SubjectType.QUESTION,
        subject_length=SubjectLength.SHORT,
        subject_personalization=SubjectPersonalization.ROLE_SPECIFIC,
        subject_case=SubjectCase.SENTENCE,
        subject_has_number=False,
        subject_emoji=False,
        preheader=Preheader.COMPLEMENTS,
        sender_type=SenderType.PERSONAL,
        body_length=BodyLength.SHORT,
        format=Format.PLAIN,
        link_count=LinkCount.ZERO,
        reading_grade=ReadingGrade.SIMPLE,
        scannable=True,
        framework=Framework.PAS,
        persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY,
        emotion=Emotion.CURIOSITY,
        specificity=Specificity.HARD_NUMBERS,
        personalization_depth=PersonalizationDepth.ONE_TO_ONE_RESEARCHED,
        cta_count=CtaCount.ONE,
        cta_type=CtaType.SOFT_REPLY,
        cta_placement=CtaPlacement.END,
        offer=Offer.NONE,
        send_daypart=SendDaypart.MIDWEEK_AM,
    )
    base.update(overrides)
    return Recipe(**base)


def test_clean_prospect_can_be_sent_to():
    g = Guardrails(GuardrailsConfig())
    p = _Prospect("p1", _ctx())
    assert g.should_send(p) is True
    assert g.filter([_recipe()], p) == [_recipe()]


def test_suppression_list_blocks_send():
    g = Guardrails(GuardrailsConfig(), suppression_list=["p1"])
    p = _Prospect("p1", _ctx())
    assert g.should_send(p) is False
    assert g.filter([_recipe()], p) == []


def test_unsubscribe_is_permanent():
    g = Guardrails(GuardrailsConfig())
    p = _Prospect("p1", _ctx())
    g.note_send(p)
    g.note_outcome(p, Outcomes(delivered=True, unsubscribe=True))
    assert g.should_send(p) is False
    # even after a new day, unsubscribe persists
    g.advance_day()
    assert g.should_send(p) is False


def test_complaint_pauses_sequence_and_counts():
    g = Guardrails(GuardrailsConfig(complaint_rate_ceiling=1.0))  # high so run not paused
    p = _Prospect("p1", _ctx())
    g.note_send(p)
    g.note_outcome(p, Outcomes(delivered=True, spam_complaint=True))
    assert g.should_send(p) is False
    assert g.complaint_rate() == 1.0


def test_per_day_frequency_cap():
    g = Guardrails(GuardrailsConfig(max_per_contact_per_day=1, max_per_contact_per_week=10))
    p = _Prospect("p1", _ctx())
    assert g.should_send(p) is True
    g.note_send(p)
    assert g.should_send(p) is False  # daily cap hit
    g.advance_day()
    assert g.should_send(p) is True   # resets next day


def test_per_week_frequency_cap():
    g = Guardrails(GuardrailsConfig(max_per_contact_per_day=10, max_per_contact_per_week=2))
    p = _Prospect("p1", _ctx())
    for _ in range(2):
        assert g.should_send(p) is True
        g.note_send(p)
        g.advance_day()
    assert g.should_send(p) is False  # weekly cap hit


def test_cooldown_after_consecutive_nonengagements():
    g = Guardrails(GuardrailsConfig(cooldown_after_n_nonengage=3))
    p = _Prospect("p1", _ctx())
    for _ in range(3):
        g.note_send(p)
        g.note_outcome(p, Outcomes(delivered=True, opened=False))
        g.advance_day()
    assert g.should_send(p) is False


def test_engagement_resets_cooldown():
    g = Guardrails(GuardrailsConfig(
        cooldown_after_n_nonengage=2, max_per_contact_per_day=10, max_per_contact_per_week=100
    ))
    p = _Prospect("p1", _ctx())
    g.note_send(p)
    g.note_outcome(p, Outcomes(delivered=True, opened=False))
    g.note_send(p)
    g.note_outcome(p, Outcomes(delivered=True, opened=True))  # engaged -> reset
    g.note_send(p)
    g.note_outcome(p, Outcomes(delivered=True, opened=False))
    g.advance_day()
    assert g.should_send(p) is True  # only 1 consecutive non-engage after reset


def test_run_pauses_when_complaint_rate_exceeds_ceiling():
    g = Guardrails(GuardrailsConfig(complaint_rate_ceiling=0.05))
    # 20 clean sends, then 2 complaints -> rate ~0.09 > 0.05
    for i in range(20):
        p = _Prospect(f"clean{i}", _ctx())
        g.note_send(p)
        g.note_outcome(p, Outcomes(delivered=True, opened=True))
    for i in range(2):
        p = _Prospect(f"bad{i}", _ctx())
        g.note_send(p)
        g.note_outcome(p, Outcomes(delivered=True, spam_complaint=True))
    assert g.run_paused is True
    fresh = _Prospect("fresh", _ctx())
    assert g.should_send(fresh) is False  # whole run halts sending


def test_banned_lever_values_prune_candidates():
    cfg = GuardrailsConfig(banned_lever_values={"subject_emoji": [True]})
    g = Guardrails(cfg)
    p = _Prospect("p1", _ctx())
    ok = _recipe(subject_emoji=False)
    bad = _recipe(subject_emoji=True)
    filtered = g.filter([ok, bad], p)
    assert ok in filtered and bad not in filtered


def test_filter_returns_empty_when_all_banned():
    cfg = GuardrailsConfig(banned_lever_values={"format": ["plain", "light_html"]})
    g = Guardrails(cfg)
    p = _Prospect("p1", _ctx())
    assert g.filter([_recipe()], p) == []


def test_run_level_cancellation_threshold():
    g = Guardrails(GuardrailsConfig(max_sends_per_day_run=2))
    a, b, c = (_Prospect(f"p{i}", _ctx()) for i in range(3))
    assert g.should_send(a) is True
    g.note_send(a)
    assert g.should_send(b) is True
    g.note_send(b)
    assert g.should_send(c) is False  # daily run cap hit
    g.advance_day()
    assert g.should_send(c) is True
