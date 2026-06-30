"""Deterministic template renderer — zero API calls. Default so the loop runs offline.

It honors the levers structurally (personalization token, framework skeleton, CTA style,
length bucket, emoji/subject case) so a human can sanity-check that the chosen recipe
maps to plausible copy without spending API budget.
"""

from __future__ import annotations

from app.planes.context import Context
from app.planes.features import (
    CtaType, Format, Framework, Persuasion, PersonalizationDepth, Recipe,
    SubjectCase, SubjectType,
)
from app.rendering.renderer import Email

_FICTIONAL_PRODUCT = "FlowDesk"
_FICTIONAL_COMPANY = "Brightline Labs"

_PROOF = {
    Persuasion.SOCIAL_PROOF_CASESTUDY: "A similar {industry} team cut onboarding time 38% in 6 weeks.",
    Persuasion.SOCIAL_PROOF_STAT: "Teams using {product} reply 2.3x faster on average.",
    Persuasion.SOCIAL_PROOF_LOGOS: "Trusted by Northwind, Vertex, and Crestview.",
    Persuasion.AUTHORITY: "Our approach is based on 200+ {industry} deployments.",
    Persuasion.RECIPROCITY: "I put together a short teardown for your team — yours free.",
    Persuasion.SCARCITY: "We onboard two {industry} teams this month.",
    Persuasion.LIKING: "Loved what your team shipped recently.",
    Persuasion.COMMITMENT: "Even a 15-minute pilot would tell us if this fits.",
    Persuasion.NONE: "",
}

_FRAMEWORK_OPENERS = {
    Framework.PAS: "Most {role}s lose hours every week to manual {department} busywork.",
    Framework.BAB: "Imagine your {department} team closing the week without the usual scramble.",
    Framework.AIDA: "Quick question about how your {department} team handles scale.",
    Framework.FAB: "{product} automates the {department} grunt work so your team ships faster.",
    Framework.NONE: "Reaching out about your {department} workflow.",
}

_CTAS = {
    CtaType.SOFT_REPLY: "Worth a quick reply?",
    CtaType.BOOK_LINK: "[Grab 15 minutes here]",
    CtaType.RESOURCE_LINK: "[See the 1-page breakdown]",
}


def _name_token(recipe: Recipe) -> str:
    depth = recipe.personalization_depth
    if depth == PersonalizationDepth.ONE_TO_ONE_RESEARCHED:
        return "{{first_name}}"
    if depth in (PersonalizationDepth.SEGMENT_TAILORED, PersonalizationDepth.MERGE_FIELD):
        return "{{first_name}}"
    return "there"


def _apply_case(text: str, case: SubjectCase) -> str:
    if case == SubjectCase.TITLE:
        return text.title()
    if case == SubjectCase.LOWER:
        return text.lower()
    return text[:1].upper() + text[1:]


class MockRenderer:
    def render(self, recipe: Recipe, context: Context) -> Email:
        c = context.as_dict()
        fields = {
            "industry": c["industry"], "role": c["role_seniority"],
            "department": c["department"], "product": _FICTIONAL_PRODUCT,
        }
        # subject
        subj_core = {
            SubjectType.QUESTION: "a faster {department} workflow?",
            SubjectType.CURIOSITY_GAP: "the {department} gap no one talks about",
            SubjectType.STATEMENT: "{department} teams are shipping faster with this",
            SubjectType.DIRECT_ASK: "15 minutes on {department} ops?",
            SubjectType.PATTERN_INTERRUPT: "delete this if {department} is perfect",
        }[recipe.subject_type].format(**fields)
        if recipe.subject_personalization.value == "company":
            subj_core = "{{company_name}}: " + subj_core
        elif recipe.subject_personalization.value == "first_name":
            subj_core = "{{first_name}}, " + subj_core
        elif recipe.subject_personalization.value == "role_specific":
            subj_core = f"For {c['role_seniority']}s: " + subj_core
        if recipe.subject_has_number:
            subj_core = "3 ways: " + subj_core
        subject = _apply_case(subj_core, recipe.subject_case)
        if recipe.subject_emoji:
            subject += " \u2728"

        # preheader
        if recipe.preheader.value == "none":
            preheader = ""
        elif recipe.preheader.value == "repeats":
            preheader = subject.replace("\u2728", "").strip()
        else:
            preheader = "A 1-line idea for your team, no pitch."

        # body
        opener = _FRAMEWORK_OPENERS[recipe.framework].format(**fields)
        proof = _PROOF[recipe.persuasion].format(**fields)
        greeting = f"Hi {_name_token(recipe)},"
        cta = _CTAS[recipe.cta_type]
        parts = [greeting, "", opener]
        if proof:
            parts += ["", proof]
        if recipe.body_length.value != "short_lt75":
            parts += ["", f"{_FICTIONAL_PRODUCT} handles the repetitive parts so your "
                          f"{c['department']} team focuses on the work that matters."]
        if recipe.cta_placement.value in ("early", "both"):
            parts.insert(2, cta)
        if recipe.cta_placement.value in ("end", "both"):
            parts += ["", cta]
        if recipe.cta_count.value == "two" and recipe.cta_placement.value != "both":
            parts += [_CTAS[CtaType.SOFT_REPLY]]
        parts += ["", f"\u2014 Sam, {_FICTIONAL_COMPANY}"]
        body = "\n".join(parts)
        if recipe.format == Format.LIGHT_HTML:
            body = body.replace("\n\n", "</p><p>")
            body = f"<p>{body}</p>"
        return {"subject": subject, "preheader": preheader, "body": body}
