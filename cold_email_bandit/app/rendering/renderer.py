"""Renderer interface and the prompt-building shared by concrete renderers."""

from __future__ import annotations

from typing import Protocol, TypedDict

from app.planes.context import Context
from app.planes.features import Recipe


class Email(TypedDict):
    subject: str
    preheader: str
    body: str


class Renderer(Protocol):
    def render(self, recipe: Recipe, context: Context) -> Email: ...


_LENGTH_WORDS = {
    "short_lt75": "under 75 words",
    "med_75to150": "75-150 words",
    "long_150plus": "150-220 words",
}


def build_brief(recipe: Recipe, context: Context) -> str:
    """Human/LLM-readable brief describing every lever the copy must obey."""
    r, c = recipe.as_dict(), context.as_dict()
    lines = [
        f"Audience: a {c['role_seniority']} in {c['department']} at a {c['company_size']} "
        f"{c['industry']} company. Sequence: {c['sequence_position']} "
        f"(prior: {c['prior_outcome']}). Goal/intent: {c['intent']}.",
        "",
        "Obey ALL of these levers exactly:",
        f"- Subject: {r['subject_type']} style, {r['subject_length']}, case={r['subject_case']}, "
        f"personalization={r['subject_personalization']}, number={r['subject_has_number']}, emoji={r['subject_emoji']}",
        f"- Preheader: {r['preheader']}",
        f"- Sender voice: {r['sender_type']}",
        f"- Body: {_LENGTH_WORDS.get(r['body_length'], r['body_length'])}, format={r['format']}, "
        f"reading_grade={r['reading_grade']}, scannable={r['scannable']}, links={r['link_count']}",
        f"- Copy strategy: framework={r['framework']}, persuasion={r['persuasion']}, emotion={r['emotion']}, "
        f"specificity={r['specificity']}, personalization_depth={r['personalization_depth']}",
        f"- CTA: count={r['cta_count']}, type={r['cta_type']}, placement={r['cta_placement']}",
        f"- Offer: {r['offer']}",
        "",
        "Use fictional company/product names. Cold outreach only. No discounts.",
    ]
    return "\n".join(lines)
