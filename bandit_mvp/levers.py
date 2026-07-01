"""Lever schema, recipe sampling, and VW feature encoding.

This is the ONE place the email lever taxonomy lives on the Python side. It mirrors
``email-lever-studio/shared/schema.ts`` (the LeverSuggestion + ColdContext taxonomy) so
the bandit and the TypeScript renderer share a single source of truth.

The bandit chooses one full recipe of levers per round, conditioned on context. Context
goes in the shared ``|C`` namespace (observed, not controlled); the levers go in each
candidate's ``|A`` namespace (controlled by the bandit). The ``-q CA`` crossing then lets
the policy learn "this lever value is good IN THIS context" instead of a context-free
average.

Design note (the 50-email baseline hook): folding the labelled emails in only touches
THIS file. Either widen the value lists below, or supply per-value sampling weights via
``load_lever_weights()`` so candidates look like real emails instead of uniform noise.
Nothing else in the system hardcodes the schema.
"""

from __future__ import annotations

import random
from typing import Any

# ---------------------------------------------------------------------------
# CONTEXT: observed, not controlled. Goes in the shared "|C" namespace.
# Mirrors the categorical parts of ColdContext (schema.ts).
# ---------------------------------------------------------------------------
CONTEXT: dict[str, list[str]] = {
    "segment": [
        "cold_prospect",
        "warm_lead",
        "trial_active",
        "trial_expiring",
        "first_time_buyer",
        "repeat",
        "vip",
        "churned",
        "win_back",
        "referral_source",
        "partner_affiliate",
        "investor_advisor",
    ],
    "intent": [
        "book_meeting",
        "drive_purchase",
        "get_reply",
        "click_to_page",
        "collect_info",
        "referral",
    ],
    "industry": [
        "ecommerce",
        "saas",
        "healthcare",
        "finance",
        "education",
        "agency",
        "other",
    ],
    "seniority": ["ic", "manager", "director", "exec"],
}

# ---------------------------------------------------------------------------
# LEVERS: controlled by the bandit. Each candidate recipe is one "|A" line.
# Flattened form of LeverSuggestion (schema.ts): subjectLine.*, preheader.*, sender.*,
# body.*, copyStrategy.*, socialProof.*, cta.*, offer.*. Booleans are encoded as the
# strings "yes"/"no" so they survive VW tokenization cleanly.
#
# NOTE: LeverSuggestion.intent is deliberately NOT a lever here. Intent is a business
# input (the campaign goal), so it lives in CONTEXT above and is echoed back into the
# rendered LeverSuggestion from context.
# ---------------------------------------------------------------------------
LEVERS: dict[str, list[str]] = {
    # subjectLine
    "sl_length": ["short", "medium", "long"],
    "sl_type": ["question", "statement", "curiosity_gap", "list", "announcement"],
    "sl_urgency": ["yes", "no"],
    "sl_number": ["yes", "no"],
    "sl_emoji": ["yes", "no"],
    "sl_casing": ["sentence", "title", "lowercase"],
    # preheader
    "ph_present": ["yes", "no"],
    "ph_length": ["short", "medium"],
    "ph_relationship": ["complements", "repeats"],
    # sender
    "sender_name": ["personal", "company", "hybrid"],
    "sender_reply_to": ["yes", "no"],
    # body
    "body_length": ["short", "medium", "long"],
    "body_format": ["plain", "html"],
    "body_links": ["zero", "one", "two_plus"],
    "body_reading": ["simple", "moderate", "advanced"],
    "body_scannable": ["yes", "no"],
    # copyStrategy
    "framework": ["aida", "pas", "bab", "fab", "none"],
    "persuasion": ["reciprocity", "authority", "scarcity", "liking", "commitment", "none"],
    "emotion": ["fear", "aspiration", "curiosity", "humor", "fomo", "status", "pain_relief"],
    "specificity": ["hard_numbers", "vague"],
    "personalization": ["generic", "merge_field", "segment_tailored", "one_to_one_researched"],
    # socialProof
    "sp_type": ["none", "volume", "name_drop", "peer", "result", "quote", "recency", "consensus"],
    "sp_placement": ["opener", "body", "pre_cta", "ps"],
    "sp_specificity": ["vague", "specific"],
    # cta
    "cta_count": ["one", "two"],
    "cta_type": ["reply", "book", "buy", "read", "download"],
    "cta_placement": ["inline", "end", "both"],
    "cta_style": ["button", "link", "plain_reply_ask"],
    # offer
    "offer_has": ["yes", "no"],
    "offer_type": ["percent_off", "dollar_off", "free_trial", "bonus", "bundle", "guarantee"],
    "offer_scarcity": ["none", "time_limited", "quantity_limited"],
}


# ---------------------------------------------------------------------------
# Sampling weights (the 50-email baseline hook)
# ---------------------------------------------------------------------------
def load_lever_weights() -> dict[str, dict[str, float]] | None:
    """Per-value sampling weights so candidates resemble real emails.

    Returns ``None`` today -> uniform sampling. When the labelled 50-email set lands in
    Postgres, ``db.lever_value_frequencies()`` returns the observed frequency of each
    ``email_analysis`` lever value; wire that in here and candidates will be drawn from
    the real distribution instead of uniform noise. This is the only change required to
    fold the baseline in.
    """
    try:
        from db import lever_value_frequencies  # local import: db is optional
    except Exception:
        return None
    return lever_value_frequencies()


def _weighted_choice(rng: random.Random, values: list[str], weights: dict[str, float] | None) -> str:
    if not weights:
        return rng.choice(values)
    w = [max(weights.get(v, 0.0), 0.0) for v in values]
    if sum(w) <= 0.0:
        return rng.choice(values)
    return rng.choices(values, weights=w, k=1)[0]


# ---------------------------------------------------------------------------
# Sampling
# ---------------------------------------------------------------------------
def sample_context(rng: random.Random | None = None) -> dict[str, str]:
    """One random context dict."""
    rng = rng or random
    return {k: rng.choice(v) for k, v in CONTEXT.items()}


def sample_recipe(
    rng: random.Random | None = None,
    weights: dict[str, dict[str, float]] | None = None,
) -> dict[str, str]:
    """One random full recipe dict (optionally biased by per-value weights)."""
    rng = rng or random
    return {
        lever: _weighted_choice(rng, values, (weights or {}).get(lever))
        for lever, values in LEVERS.items()
    }


def candidate_recipes(
    k: int,
    rng: random.Random | None = None,
    weights: dict[str, dict[str, float]] | None = None,
) -> list[dict[str, str]]:
    """A list of ``k`` candidate recipes for one decision round."""
    rng = rng or random
    return [sample_recipe(rng, weights) for _ in range(k)]


# ---------------------------------------------------------------------------
# VW feature encoding
# ---------------------------------------------------------------------------
def _tokens(d: dict[str, str]) -> str:
    return " ".join(f"{k}={v}" for k, v in d.items())


def context_line(ctx: dict[str, str]) -> str:
    """The shared context line, e.g. ``shared |C segment=... intent=...``."""
    return f"shared |C {_tokens(ctx)}"


def action_line(recipe: dict[str, str]) -> str:
    """One candidate action line, e.g. ``|A framework=... emotion=...``."""
    return f"|A {_tokens(recipe)}"


# ---------------------------------------------------------------------------
# Bridge to the TypeScript renderer (LeverSuggestion JSON shape)
# ---------------------------------------------------------------------------
_DEFAULT_CTA_COPY = "Would you be open to a quick reply?"


def _b(v: str) -> bool:
    return v == "yes"


def recipe_to_lever_suggestion(recipe: dict[str, str], ctx: dict[str, str]) -> dict[str, Any]:
    """Rebuild the nested ``LeverSuggestion`` JSON that ``/api/generate-draft`` expects.

    Field names and enum values match ``email-lever-studio/shared/schema.ts`` exactly, so
    the TypeScript ``normalizeLeverSuggestion`` accepts it unchanged. Intent comes from
    the context (the campaign goal), not from the bandit.
    """
    r = recipe

    def card(values: dict[str, Any], reasoning: str, **extra: Any) -> dict[str, Any]:
        return {"values": values, "reasoning": reasoning, "locked": False, **extra}

    return {
        "intent": {
            "value": ctx.get("intent", "get_reply"),
            "reasoning": "Campaign goal supplied as context.",
            "locked": False,
        },
        "subjectLine": card(
            {
                "length": r["sl_length"],
                "personalizationToken": False,
                "type": r["sl_type"],
                "urgency": _b(r["sl_urgency"]),
                "numberIncluded": _b(r["sl_number"]),
                "emoji": _b(r["sl_emoji"]),
                "casing": {"sentence": "sentence", "title": "title", "lowercase": "lowercase"}[r["sl_casing"]],
            },
            "Bandit-selected subject lever recipe.",
        ),
        "preheader": card(
            {
                "present": _b(r["ph_present"]),
                "length": r["ph_length"],
                "relationship": r["ph_relationship"],
            },
            "Bandit-selected preheader recipe.",
        ),
        "sender": card(
            {"nameType": r["sender_name"], "replyToSet": _b(r["sender_reply_to"])},
            "Bandit-selected sender recipe.",
        ),
        "body": card(
            {
                "length": r["body_length"],
                "format": r["body_format"],
                "linkCount": r["body_links"],
                "readingLevel": r["body_reading"],
                "scannable": _b(r["body_scannable"]),
            },
            "Bandit-selected body recipe.",
        ),
        "copyStrategy": card(
            {
                "framework": _FRAMEWORK_TO_TS[r["framework"]],
                "persuasion": r["persuasion"],
                "emotion": r["emotion"],
                "specificity": r["specificity"],
                "personalizationDepth": r["personalization"],
            },
            "Bandit-selected copy strategy recipe.",
        ),
        "socialProof": card(
            {
                "type": r["sp_type"],
                "placement": r["sp_placement"],
                "specificity": r["sp_specificity"],
            },
            "Bandit-selected social proof recipe.",
        ),
        "cta": card(
            {
                "count": r["cta_count"],
                "type": r["cta_type"],
                "placement": r["cta_placement"],
                "style": r["cta_style"],
            },
            "Bandit-selected CTA recipe.",
            ctaCopy=_DEFAULT_CTA_COPY,
        ),
        "offer": card(
            {
                "hasOffer": _b(r["offer_has"]),
                "type": r["offer_type"],
                "magnitude": "",
                "scarcity": r["offer_scarcity"],
            },
            "Bandit-selected offer recipe.",
        ),
    }


# copyStrategy.framework uses upper-case tokens in the TS schema (AIDA, PAS, ...) but we
# keep VW features lower-case. Map on the way out.
_FRAMEWORK_TO_TS = {"aida": "AIDA", "pas": "PAS", "bab": "BAB", "fab": "FAB", "none": "none"}


if __name__ == "__main__":
    rng = random.Random(0)
    ctx = sample_context(rng)
    recipe = sample_recipe(rng)
    print("context:", ctx)
    print("recipe: ", recipe)
    print()
    print(context_line(ctx))
    print(action_line(recipe))
