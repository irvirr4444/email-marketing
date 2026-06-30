"""Plane 3 — DELIVERABILITY: the gate in front of everything.

For cold email, inbox placement is more predictive than any copy tag, so we model it
as a hard gate computed from the *recipe* (content/spam risk), modulated by a running
domain-health variable. Placement then caps the open probability downstream.
"""

from __future__ import annotations

from app.config import DeliverabilityConfig
from app.planes.features import (
    CtaCount,
    Emotion,
    Format,
    LinkCount,
    Persuasion,
    Recipe,
    SubjectCase,
)

PLACEMENTS = ("primary", "promotions", "spam")


def spam_risk(recipe: Recipe) -> float:
    """Content spam-risk in [0, 1] derived only from the recipe (not context)."""
    risk = 0.0
    if recipe.link_count == LinkCount.TWO_PLUS:
        risk += 0.25
    elif recipe.link_count == LinkCount.ONE:
        risk += 0.05
    if recipe.format == Format.LIGHT_HTML:
        risk += 0.15
    if recipe.subject_emoji:
        risk += 0.15
    if recipe.subject_case == SubjectCase.TITLE and recipe.subject_has_number:
        risk += 0.10  # looks promotional
    if recipe.cta_count == CtaCount.TWO:
        risk += 0.10
    # "spammy tone" component
    if recipe.persuasion == Persuasion.SCARCITY or recipe.emotion == Emotion.FOMO:
        risk += 0.20
    return max(0.0, min(1.0, risk))


def _infra_penalty(cfg: DeliverabilityConfig) -> float:
    """Extra risk contributed by imperfect sending infrastructure (fixed healthy in v1)."""
    penalty = 0.0
    penalty += {"healthy": 0.0, "warming": 0.10, "cold": 0.25}.get(cfg.domain_warmup, 0.0)
    penalty += {"pass": 0.0, "partial": 0.10, "fail": 0.30}.get(cfg.spf_dkim_dmarc, 0.0)
    return penalty


def placement_distribution(
    recipe: Recipe,
    cfg: DeliverabilityConfig,
    domain_health: float = 1.0,
) -> dict[str, float]:
    """Map total risk -> probability over (primary, promotions, spam).

    ``domain_health`` in (0, 1]; lower health pushes mass toward promotions/spam,
    modeling cumulative complaint damage during a run.
    """
    risk = spam_risk(recipe) + _infra_penalty(cfg)
    risk += (1.0 - max(0.0, min(1.0, domain_health))) * 0.6
    risk = max(0.0, min(1.0, risk))

    # Smooth, monotone mapping. spam only meaningfully appears past moderate risk.
    spam_p = max(0.0, (risk - 0.35)) / 0.65 * 0.70
    promotions_p = risk * 0.45
    primary_p = max(0.05, 1.0 - spam_p - promotions_p)

    total = spam_p + promotions_p + primary_p
    return {
        "primary": primary_p / total,
        "promotions": promotions_p / total,
        "spam": spam_p / total,
    }


def open_multiplier(placement: str, cfg: DeliverabilityConfig) -> float:
    """How hard placement gates the open probability."""
    return cfg.placement_open_multiplier.get(placement, 1.0)
