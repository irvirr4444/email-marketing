"""Recovery check — the real proof of learning.

Because ground truth is known, after training we can ask, per context: how close is the
policy's chosen recipe to the oracle's, both in realized expected score and in the actual
lever values picked. We also probe specific planted truths (interactions) directly.

Nothing here is visible to the bandit during training; it only reads the trained policy.
"""

from __future__ import annotations

import random
from dataclasses import replace
from typing import Any, Optional

from app.bandit.candidate_sampler import CandidateSampler
from app.environment.ground_truth import GroundTruth
from app.environment.prospects import ProspectStream
from app.planes.context import (
    CompanySize, Context, Department, GeoTimezone, Industry, Intent,
    PriorOutcome, RoleSeniority, SequencePosition,
)
from app.planes.features import (
    BodyLength, CtaCount, CtaPlacement, CtaType, Emotion, Format, Framework,
    LinkCount, Offer, Persuasion, PersonalizationDepth, Preheader, ReadingGrade,
    Recipe, SenderType, Specificity, SubjectCase, SubjectLength,
    SubjectPersonalization, SubjectType, SendDaypart, DIMENSION_NAMES,
)


def good_base_recipe() -> Recipe:
    """A reasonable, near-optimal cold recipe used as a fixed backdrop for probes."""
    return Recipe(
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


def ctx(**ov) -> Context:
    base = dict(
        industry=Industry.SAAS, company_size=CompanySize.MID, role_seniority=RoleSeniority.DIRECTOR,
        department=Department.SALES, geo_timezone=GeoTimezone.US_EASTERN,
        sequence_position=SequencePosition.EMAIL_1, prior_outcome=PriorOutcome.NONE,
        intent=Intent.GET_REPLY,
    )
    base.update(ov)
    return Context(**base)


def policy_prefers(engine, context: Context, recipe_a: Recipe, recipe_b: Recipe) -> bool:
    """True iff the trained policy ranks recipe_a above recipe_b for this context."""
    return engine.policy.best(context, [recipe_a, recipe_b]) == 0


def evaluate(engine, n_contexts: int = 400, pool: int = 30, seed: int = 9090) -> dict[str, float]:
    """Per fresh context: compare policy argmax vs oracle argmax over the same pool."""
    cfg, gt = engine.cfg, engine.gt
    stream = ProspectStream(random.Random(seed))
    samp = CandidateSampler(random.Random(seed + 1))
    pol_sum = orc_sum = 0.0
    lever_match = 0.0
    for _ in range(n_contexts):
        c = stream.next().context
        cands = samp.sample(c, pool)
        scores = [gt.expected_score(r, c, cfg.objective, cfg.deliverability) for r in cands]
        orc_idx = max(range(len(cands)), key=lambda i: scores[i])
        pol_idx = engine.policy.best(c, cands)
        pol_sum += scores[pol_idx]
        orc_sum += scores[orc_idx]
        a, b = cands[pol_idx].as_dict(), cands[orc_idx].as_dict()
        lever_match += sum(a[d] == b[d] for d in DIMENSION_NAMES) / len(DIMENSION_NAMES)
    pol_mean = pol_sum / n_contexts
    orc_mean = orc_sum / n_contexts
    return {
        "policy_mean": pol_mean,
        "oracle_mean": orc_mean,
        "ratio": pol_mean / orc_mean if orc_mean else 0.0,
        "lever_match_rate": lever_match / n_contexts,
        "n_contexts": n_contexts,
        "pool": pool,
    }


def interaction_checks(engine) -> dict[str, bool]:
    """Probe specific planted truths the policy should have rediscovered."""
    base = good_base_recipe()
    checks: dict[str, bool] = {}

    # 1) personalization: one_to_one_researched beats generic (strongest reply lever)
    checks["personalization_one_to_one>generic"] = policy_prefers(
        engine, ctx(),
        replace(base, personalization_depth=PersonalizationDepth.ONE_TO_ONE_RESEARCHED),
        replace(base, personalization_depth=PersonalizationDepth.GENERIC),
    )
    # 2) format: plain beats light_html
    checks["format_plain>html"] = policy_prefers(
        engine, ctx(), replace(base, format=Format.PLAIN), replace(base, format=Format.LIGHT_HTML)
    )
    # 3) sender: personal beats company for cold
    checks["sender_personal>company"] = policy_prefers(
        engine, ctx(), replace(base, sender_type=SenderType.PERSONAL),
        replace(base, sender_type=SenderType.COMPANY),
    )
    # 4) email_1: a calm recipe beats a scarcity/fomo trap (avoids the trap)
    c1 = ctx(sequence_position=SequencePosition.EMAIL_1)
    checks["email1_avoids_scarcity"] = policy_prefers(
        engine, c1, replace(base, persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY, emotion=Emotion.CURIOSITY),
        replace(base, persuasion=Persuasion.SCARCITY, emotion=Emotion.FOMO),
    )
    # 5) INTERACTION: case-study social proof preferred more strongly at SaaS x email_2 than email_1
    saas2 = ctx(industry=Industry.SAAS, sequence_position=SequencePosition.EMAIL_2)
    checks["saas_email2_prefers_casestudy"] = policy_prefers(
        engine, saas2, replace(base, persuasion=Persuasion.SOCIAL_PROOF_CASESTUDY),
        replace(base, persuasion=Persuasion.NONE),
    )
    # 6) INTERACTION: authority preferred for c_level
    cexec = ctx(role_seniority=RoleSeniority.C_LEVEL)
    checks["clevel_prefers_authority"] = policy_prefers(
        engine, cexec, replace(base, persuasion=Persuasion.AUTHORITY),
        replace(base, persuasion=Persuasion.NONE),
    )
    return checks


def recovery_report(
    engine,
    tracker: Optional[Any] = None,
    n_contexts: int = 400,
    pool: int = 30,
    ratio_threshold: float = 0.85,
    seed: int = 9090,
) -> dict[str, Any]:
    ev = evaluate(engine, n_contexts=n_contexts, pool=pool, seed=seed)
    checks = interaction_checks(engine)
    interactions_passed = sum(checks.values())
    lift = tracker.lift() if tracker is not None else None

    passed = ev["ratio"] >= ratio_threshold and interactions_passed >= len(checks) - 1
    if lift is not None:
        passed = passed and lift["significant"] and lift["lift"] > 0
    return {
        **ev,
        "interactions": checks,
        "interactions_passed": interactions_passed,
        "interactions_total": len(checks),
        "lift": lift,
        "ratio_threshold": ratio_threshold,
        "pass": passed,
    }
