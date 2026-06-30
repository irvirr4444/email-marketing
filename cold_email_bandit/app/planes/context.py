"""Plane 2 — CONTEXT: observed prospect state the bandit adapts to but cannot change.

Context is the ``shared`` example in CB-ADF. The whole value proposition is learning
lever choices *conditioned* on this context, so these fields must be expressive enough
to drive interactions (industry x persuasion, seniority x body_length, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass, fields
from enum import Enum
from typing import Any

from app.planes.features import StrEnum


class Industry(StrEnum):
    SAAS = "SaaS"
    ECOMMERCE = "ecommerce"
    AGENCY = "agency"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    REAL_ESTATE = "real_estate"
    EDUCATION = "education"
    MANUFACTURING = "manufacturing"
    OTHER = "other"


class CompanySize(StrEnum):
    SMB = "smb"
    MID = "mid"
    ENTERPRISE = "enterprise"


class RoleSeniority(StrEnum):
    IC = "ic"
    MANAGER = "manager"
    DIRECTOR = "director"
    VP = "vp"
    C_LEVEL = "c_level"


class Department(StrEnum):
    SALES = "sales"
    MARKETING = "marketing"
    ENGINEERING = "engineering"
    OPS = "ops"
    FINANCE = "finance"
    FOUNDER = "founder"


class GeoTimezone(StrEnum):
    US_EASTERN = "us_eastern"
    US_CENTRAL = "us_central"
    US_PACIFIC = "us_pacific"
    EMEA = "emea"
    APAC = "apac"


class SequencePosition(StrEnum):
    EMAIL_1 = "email_1"
    EMAIL_2 = "email_2"
    EMAIL_3 = "email_3"
    EMAIL_4PLUS = "email_4plus"
    BREAKUP = "breakup"


class PriorOutcome(StrEnum):
    NONE = "none"
    OPENED_NO_REPLY = "opened_no_reply"
    DIDNT_OPEN = "didnt_open"
    CLICKED_NO_REPLY = "clicked_no_reply"


class Intent(StrEnum):
    """Cold-outreach intents only. Set per campaign (context), never learned."""

    BOOK_MEETING = "book_meeting"
    GET_REPLY = "get_reply"


# Daypart that "matches" each timezone bucket (drives daypart x tz interaction in truth).
PREFERRED_DAYPART_BY_TZ: dict[GeoTimezone, str] = {
    GeoTimezone.US_EASTERN: "midweek_am",
    GeoTimezone.US_CENTRAL: "midweek_am",
    GeoTimezone.US_PACIFIC: "midweek_pm",
    GeoTimezone.EMEA: "midweek_am",
    GeoTimezone.APAC: "midweek_pm",
}


@dataclass(frozen=True)
class Context:
    """The observed context for a single send. Language is fixed to ``en`` in v1."""

    industry: Industry
    company_size: CompanySize
    role_seniority: RoleSeniority
    department: Department
    geo_timezone: GeoTimezone
    sequence_position: SequencePosition
    prior_outcome: PriorOutcome
    intent: Intent
    days_since_previous: int = 0
    lifetime_emails_received: int = 0
    language: str = "en"

    def as_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for f in fields(self):
            val = getattr(self, f.name)
            out[f.name] = val.value if isinstance(val, StrEnum) else val
        return out

    def feature_tokens(self) -> dict[str, str]:
        """Short tokens for the VW shared Context namespace.

        Integer fields are bucketed so the bandit gets coarse, generalizable signals
        rather than one weight per exact integer value.
        """
        d = self.as_dict()
        tokens: dict[str, str] = {}
        for k, v in d.items():
            if k == "days_since_previous":
                tokens["dsp"] = _bucket_days(int(v))
            elif k == "lifetime_emails_received":
                tokens["ler"] = _bucket_count(int(v))
            else:
                tokens[k] = str(v)
        return tokens


def _bucket_days(d: int) -> str:
    if d <= 0:
        return "0"
    if d <= 2:
        return "1_2"
    if d <= 5:
        return "3_5"
    if d <= 10:
        return "6_10"
    return "11plus"


def _bucket_count(c: int) -> str:
    if c <= 0:
        return "0"
    if c <= 2:
        return "1_2"
    if c <= 5:
        return "3_5"
    if c <= 10:
        return "6_10"
    return "11plus"
