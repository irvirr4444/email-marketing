"""Plane 1 — FEATURES: the levers the bandit chooses.

A ``Recipe`` is exactly one choice per dimension. The set of dimensions and their
allowed values is published as ``DIMENSIONS`` so the candidate sampler, the VW
encoder, and the oracle all agree on the action space without enumerating its full
Cartesian product (~10^9).

Scope is hard-fixed to cold outreach (see the build prompt, section 2): no discount
offers, cold-appropriate offers only.
"""

from __future__ import annotations

from dataclasses import dataclass, fields
from enum import Enum
from typing import Any


class StrEnum(str, Enum):
    """str-valued enum so members serialize cleanly into VW feature strings and JSON."""

    def __str__(self) -> str:  # pragma: no cover - cosmetic
        return self.value


class SubjectType(StrEnum):
    QUESTION = "question"
    CURIOSITY_GAP = "curiosity_gap"
    STATEMENT = "statement"
    DIRECT_ASK = "direct_ask"
    PATTERN_INTERRUPT = "pattern_interrupt"


class SubjectLength(StrEnum):
    SHORT = "short_3to5w"
    MED = "med_6to9w"
    LONG = "long_10w_plus"


class SubjectPersonalization(StrEnum):
    NONE = "none"
    FIRST_NAME = "first_name"
    COMPANY = "company"
    ROLE_SPECIFIC = "role_specific"


class SubjectCase(StrEnum):
    SENTENCE = "sentence"
    TITLE = "title"
    LOWER = "lower"


class Preheader(StrEnum):
    NONE = "none"
    COMPLEMENTS = "complements"
    REPEATS = "repeats"


class SenderType(StrEnum):
    PERSONAL = "personal"
    COMPANY = "company"
    HYBRID = "hybrid"


class BodyLength(StrEnum):
    SHORT = "short_lt75"
    MED = "med_75to150"
    LONG = "long_150plus"


class Format(StrEnum):
    PLAIN = "plain"
    LIGHT_HTML = "light_html"


class LinkCount(StrEnum):
    ZERO = "zero"
    ONE = "one"
    TWO_PLUS = "two_plus"


class ReadingGrade(StrEnum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class Framework(StrEnum):
    NONE = "none"
    AIDA = "AIDA"
    PAS = "PAS"
    BAB = "BAB"
    FAB = "FAB"


class Persuasion(StrEnum):
    NONE = "none"
    RECIPROCITY = "reciprocity"
    SOCIAL_PROOF_CASESTUDY = "social_proof_casestudy"
    SOCIAL_PROOF_STAT = "social_proof_stat"
    SOCIAL_PROOF_LOGOS = "social_proof_logos"
    AUTHORITY = "authority"
    SCARCITY = "scarcity"
    LIKING = "liking"
    COMMITMENT = "commitment"


class Emotion(StrEnum):
    NONE = "none"
    CURIOSITY = "curiosity"
    ASPIRATION = "aspiration"
    PAIN_RELIEF = "pain_relief"
    STATUS = "status"
    HUMOR = "humor"
    FOMO = "fomo"


class Specificity(StrEnum):
    VAGUE = "vague"
    HARD_NUMBERS = "hard_numbers"


class PersonalizationDepth(StrEnum):
    GENERIC = "generic"
    MERGE_FIELD = "merge_field"
    SEGMENT_TAILORED = "segment_tailored"
    ONE_TO_ONE_RESEARCHED = "one_to_one_researched"


class CtaCount(StrEnum):
    ONE = "one"
    TWO = "two"


class CtaType(StrEnum):
    SOFT_REPLY = "soft_reply"
    BOOK_LINK = "book_link"
    RESOURCE_LINK = "resource_link"


class CtaPlacement(StrEnum):
    EARLY = "early"
    END = "end"
    BOTH = "both"


class Offer(StrEnum):
    NONE = "none"
    FREE_RESOURCE = "free_resource"
    FREE_AUDIT = "free_audit"
    TRIAL = "trial"


class SendDaypart(StrEnum):
    MON_AM = "mon_am"
    MIDWEEK_AM = "midweek_am"
    MIDWEEK_PM = "midweek_pm"
    FRI_AM = "fri_am"
    OFFHOURS = "offhours"


@dataclass(frozen=True)
class Recipe:
    """One structured email "recipe": a single choice per Plane-1 dimension."""

    subject_type: SubjectType
    subject_length: SubjectLength
    subject_personalization: SubjectPersonalization
    subject_case: SubjectCase
    subject_has_number: bool
    subject_emoji: bool
    preheader: Preheader
    sender_type: SenderType
    body_length: BodyLength
    format: Format
    link_count: LinkCount
    reading_grade: ReadingGrade
    scannable: bool
    framework: Framework
    persuasion: Persuasion
    emotion: Emotion
    specificity: Specificity
    personalization_depth: PersonalizationDepth
    cta_count: CtaCount
    cta_type: CtaType
    cta_placement: CtaPlacement
    offer: Offer
    send_daypart: SendDaypart

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for f in fields(self):
            val = getattr(self, f.name)
            out[f.name] = val.value if isinstance(val, StrEnum) else val
        return out

    def feature_tokens(self) -> dict[str, str]:
        """Short ``name=value`` tokens used by the VW Action namespace encoder."""
        d = self.as_dict()
        return {k: (str(v).lower() if isinstance(v, bool) else str(v)) for k, v in d.items()}


# The published action space: dimension name -> ordered tuple of allowed values.
# Booleans are represented as (False, True). Drives the sampler, encoder, and oracle.
DIMENSIONS: dict[str, tuple[Any, ...]] = {
    "subject_type": tuple(SubjectType),
    "subject_length": tuple(SubjectLength),
    "subject_personalization": tuple(SubjectPersonalization),
    "subject_case": tuple(SubjectCase),
    "subject_has_number": (False, True),
    "subject_emoji": (False, True),
    "preheader": tuple(Preheader),
    "sender_type": tuple(SenderType),
    "body_length": tuple(BodyLength),
    "format": tuple(Format),
    "link_count": tuple(LinkCount),
    "reading_grade": tuple(ReadingGrade),
    "scannable": (False, True),
    "framework": tuple(Framework),
    "persuasion": tuple(Persuasion),
    "emotion": tuple(Emotion),
    "specificity": tuple(Specificity),
    "personalization_depth": tuple(PersonalizationDepth),
    "cta_count": tuple(CtaCount),
    "cta_type": tuple(CtaType),
    "cta_placement": tuple(CtaPlacement),
    "offer": tuple(Offer),
    "send_daypart": tuple(SendDaypart),
}

DIMENSION_NAMES: tuple[str, ...] = tuple(DIMENSIONS.keys())


def action_space_size() -> int:
    size = 1
    for vals in DIMENSIONS.values():
        size *= len(vals)
    return size


def recipe_from_choices(choices: dict[str, Any]) -> Recipe:
    """Build a Recipe from a {dimension: value} mapping (values may be enums or raw)."""
    return Recipe(**choices)
