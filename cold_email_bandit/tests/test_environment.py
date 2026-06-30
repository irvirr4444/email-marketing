"""Milestone 2: confirm the synthetic environment produces sane, opinionated outcomes."""

import random
from dataclasses import replace

import pytest

from app.bandit.candidate_sampler import random_recipe
from app.config import load_config
from app.environment.ground_truth import GroundTruth
from app.environment.prospects import ProspectStream
from app.environment.simulator import Simulator
from app.planes.context import (
    CompanySize, Context, Department, GeoTimezone, Industry, Intent,
    PriorOutcome, RoleSeniority, SequencePosition,
)
from app.planes.features import (
    BodyLength, CtaCount, CtaPlacement, CtaType, Emotion, Format, Framework,
    LinkCount, Offer, Persuasion, PersonalizationDepth, Preheader, ReadingGrade,
    Recipe, SenderType, Specificity, SubjectCase, SubjectLength,
    SubjectPersonalization, SubjectType, SendDaypart,
)


def _ctx(**ov) -> Context:
    base = dict(
        industry=Industry.SAAS, company_size=CompanySize.MID, role_seniority=RoleSeniority.DIRECTOR,
        department=Department.SALES, geo_timezone=GeoTimezone.US_EASTERN,
        sequence_position=SequencePosition.EMAIL_1, prior_outcome=PriorOutcome.NONE,
        intent=Intent.GET_REPLY,
    )
    base.update(ov)
    return Context(**base)


def _recipe(**ov) -> Recipe:
    base = dict(
        subject_type=SubjectType.QUESTION, subject_length=SubjectLength.SHORT,
        subject_personalization=SubjectPersonalization.ROLE_SPECIFIC, subject_case=SubjectCase.SENTENCE,
        subject_has_number=False, subject_emoji=False, preheader=Preheader.COMPLEMENTS,
        sender_type=SenderType.PERSONAL, body_length=BodyLength.SHORT, format=Format.PLAIN,
        link_count=LinkCount.ZERO, reading_grade=ReadingGrade.SIMPLE, scannable=True,
        framework=Framework.PAS, persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY, emotion=Emotion.CURIOSITY,
        specificity=Specificity.HARD_NUMBERS, personalization_depth=PersonalizationDepth.ONE_TO_ONE_RESEARCHED,
        cta_count=CtaCount.ONE, cta_type=CtaType.SOFT_REPLY, cta_placement=CtaPlacement.END,
        offer=Offer.NONE, send_daypart=SendDaypart.MIDWEEK_AM,
    )
    base.update(ov)
    return Recipe(**base)


def _run_many(recipe, ctx, n=4000, seed=1):
    cfg = load_config()
    sim = Simulator(cfg, GroundTruth(), random.Random(seed))
    agg = {"opened": 0, "clicked": 0, "replied": 0, "complaint": 0, "unsub": 0, "delivered": 0}
    for _ in range(n):
        o = sim.run(recipe, ctx)
        agg["delivered"] += o.delivered
        agg["opened"] += o.opened
        agg["clicked"] += o.clicked
        agg["replied"] += o.replied
        agg["complaint"] += o.spam_complaint
        agg["unsub"] += o.unsubscribe
    return {k: v / n for k, v in agg.items()}


def test_delivery_rate_high():
    rates = _run_many(_recipe(), _ctx())
    assert 0.95 <= rates["delivered"] <= 1.0


def test_open_and_reply_rates_in_cold_email_range():
    strong = _run_many(_recipe(), _ctx())
    weak = _run_many(
        _recipe(
            personalization_depth=PersonalizationDepth.GENERIC,
            format=Format.LIGHT_HTML,
            framework=Framework.NONE,
            sender_type=SenderType.COMPANY,
            subject_personalization=SubjectPersonalization.NONE,
        ),
        _ctx(),
    )
    # believable bands: a strong recipe is good but not absurd; a weak one is poor
    assert 0.15 <= strong["opened"] <= 0.80
    assert 0.02 <= strong["replied"] <= 0.45
    assert weak["replied"] < strong["replied"]
    assert weak["replied"] < 0.10  # generic, company-sender, html cold email lands flat


def test_scarcity_raises_complaints():
    calm = _run_many(_recipe(persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY), _ctx())
    spammy = _run_many(_recipe(persuasion=Persuasion.SCARCITY, emotion=Emotion.FOMO), _ctx())
    assert spammy["complaint"] > calm["complaint"]
    assert spammy["unsub"] > calm["unsub"]


def test_scarcity_lifts_clicks_but_is_a_trap_on_score():
    """Scarcity/fomo raise raw clicks yet lose on the composite objective."""
    gt = GroundTruth()
    cfg = load_config()
    ctx = _ctx()
    calm = _recipe(persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY, emotion=Emotion.CURIOSITY)
    trap = _recipe(persuasion=Persuasion.SCARCITY, emotion=Emotion.FOMO)
    p_calm = gt.expected_probs(calm, ctx, cfg.deliverability)
    p_trap = gt.expected_probs(trap, ctx, cfg.deliverability)
    assert p_trap["click"] > p_calm["click"]                      # trap lifts clicks
    s_calm = gt.expected_score(calm, ctx, cfg.objective, cfg.deliverability)
    s_trap = gt.expected_score(trap, ctx, cfg.objective, cfg.deliverability)
    assert s_calm > s_trap                                        # but loses on score


def test_plain_beats_light_html_on_score():
    gt, cfg, ctx = GroundTruth(), load_config(), _ctx()
    plain = gt.expected_score(_recipe(format=Format.PLAIN), ctx, cfg.objective, cfg.deliverability)
    html = gt.expected_score(_recipe(format=Format.LIGHT_HTML), ctx, cfg.objective, cfg.deliverability)
    assert plain > html


def test_casestudy_interaction_saas_email2():
    """social_proof_casestudy x SaaS x email_2 should beat email_1 for the same recipe."""
    gt, cfg = GroundTruth(), load_config()
    r = _recipe(persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY)
    s1 = gt.expected_score(r, _ctx(sequence_position=SequencePosition.EMAIL_1), cfg.objective, cfg.deliverability)
    s2 = gt.expected_score(r, _ctx(sequence_position=SequencePosition.EMAIL_2), cfg.objective, cfg.deliverability)
    assert s2 > s1


def test_random_policy_aggregate_complaint_rate_is_low_but_nonzero():
    """Across random recipes complaints should be present but not dominate."""
    cfg = load_config()
    sim = Simulator(cfg, GroundTruth(), random.Random(7))
    stream = ProspectStream(random.Random(7))
    rng = random.Random(7)
    complaints = sends = 0
    for _ in range(6000):
        p = stream.next()
        o = sim.run(random_recipe(rng), p.context)
        sends += 1
        complaints += o.spam_complaint
        stream.update_sequence_state(p, o)
    rate = complaints / sends
    assert 0.0 < rate < 0.15  # present, but a random policy isn't catastrophic


def test_sequence_state_carries_prior_outcome():
    stream = ProspectStream(random.Random(3), p_new=0.0)  # force reuse after first
    p = stream.next()
    assert p.context.sequence_position == SequencePosition.EMAIL_1
    assert p.context.prior_outcome == PriorOutcome.NONE
    from app.planes.outcomes import Outcomes
    stream.update_sequence_state(p, Outcomes(delivered=True, opened=True))  # opened, no reply
    assert p.context.sequence_position == SequencePosition.EMAIL_2
    assert p.context.prior_outcome == PriorOutcome.OPENED_NO_REPLY
