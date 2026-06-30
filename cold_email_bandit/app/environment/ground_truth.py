"""Hidden ground-truth reward model with planted coefficients.

The bandit's job is to rediscover these planted truths from noisy outcomes. Because we
know them exactly, we can measure how close to optimal the learned policy gets (see
metrics/recovery). NOTHING in the bandit or encoder may import or peek at this module's
coefficients at decision time.

Design:
- Every funnel stage has a base rate expressed as a logit, plus lever main-effects and
  context-conditioned interaction effects.
- ``logits()`` returns the deterministic logits (used by the simulator, which adds
  Gaussian noise per draw so the truth is not trivially separable).
- ``expected_*`` methods return noise-free expectations (used by the oracle / recovery
  check to compute the best achievable score per context).
"""

from __future__ import annotations

import math

from app.config import DeliverabilityConfig
from app.planes import deliverability
from app.planes.context import (
    PREFERRED_DAYPART_BY_TZ,
    Context,
    Industry,
    Intent,
    RoleSeniority,
    SequencePosition,
)
from app.planes.features import (
    BodyLength,
    CtaCount,
    CtaPlacement,
    CtaType,
    Emotion,
    Format,
    Framework,
    LinkCount,
    Persuasion,
    PersonalizationDepth,
    Recipe,
    SenderType,
    Specificity,
    SubjectCase,
    SubjectLength,
    SubjectPersonalization,
    SubjectType,
)

P_DELIVERED = 0.985


def _logit(p: float) -> float:
    p = min(max(p, 1e-6), 1 - 1e-6)
    return math.log(p / (1 - p))


def sigmoid(z: float) -> float:
    if z >= 0:
        return 1.0 / (1.0 + math.exp(-z))
    e = math.exp(z)
    return e / (1.0 + e)


class GroundTruth:
    """Planted reality of cold email. Opinionated but realistic."""

    def __init__(self, noise_sigma: float = 0.35):
        self.noise_sigma = noise_sigma

    # ------------------------------------------------------------------ logits ----
    def _open_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.38)
        if r.subject_type in (SubjectType.QUESTION, SubjectType.CURIOSITY_GAP):
            z += 0.25
        elif r.subject_type == SubjectType.PATTERN_INTERRUPT:
            z += 0.10
        elif r.subject_type == SubjectType.DIRECT_ASK:
            z -= 0.05
        if r.subject_length == SubjectLength.SHORT:
            z += 0.20
        elif r.subject_length == SubjectLength.LONG:
            z -= 0.20
        if (
            r.subject_type in (SubjectType.QUESTION, SubjectType.CURIOSITY_GAP)
            and r.subject_length == SubjectLength.SHORT
        ):
            z += 0.20  # short question/curiosity opens best
        z += {
            SubjectPersonalization.NONE: -0.10,
            SubjectPersonalization.FIRST_NAME: 0.15,
            SubjectPersonalization.COMPANY: 0.10,
            SubjectPersonalization.ROLE_SPECIFIC: 0.30,
        }[r.subject_personalization]
        if r.subject_emoji:
            z -= 0.15
        if r.subject_case == SubjectCase.TITLE:
            z -= 0.10
        if r.subject_has_number:
            z += 0.05
        return z

    def _reply_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.08)
        z += {
            PersonalizationDepth.GENERIC: -0.90,
            PersonalizationDepth.MERGE_FIELD: -0.10,
            PersonalizationDepth.SEGMENT_TAILORED: 0.40,
            PersonalizationDepth.ONE_TO_ONE_RESEARCHED: 0.95,
        }[r.personalization_depth]
        z += 0.30 if r.format == Format.PLAIN else -0.30
        seq = c.sequence_position
        if seq == SequencePosition.EMAIL_1:
            z += {BodyLength.SHORT: 0.40, BodyLength.MED: 0.0, BodyLength.LONG: -0.50}[r.body_length]
        else:
            z += {BodyLength.SHORT: 0.15, BodyLength.MED: 0.25, BodyLength.LONG: -0.20}[r.body_length]
        z += {
            Framework.NONE: -0.30,
            Framework.AIDA: 0.15,
            Framework.PAS: 0.40,
            Framework.BAB: 0.40,
            Framework.FAB: 0.10,
        }[r.framework]
        z += 0.20 if r.cta_count == CtaCount.ONE else -0.20
        if seq == SequencePosition.EMAIL_1:
            z += {CtaType.SOFT_REPLY: 0.35, CtaType.BOOK_LINK: -0.20, CtaType.RESOURCE_LINK: 0.0}[r.cta_type]
        else:
            z += {CtaType.SOFT_REPLY: 0.20, CtaType.BOOK_LINK: 0.10, CtaType.RESOURCE_LINK: 0.0}[r.cta_type]
        z += {SenderType.PERSONAL: 0.30, SenderType.COMPANY: -0.20, SenderType.HYBRID: 0.05}[r.sender_type]
        if r.subject_emoji:
            z -= 0.20
        if r.subject_case == SubjectCase.TITLE:
            z -= 0.15
        z += 0.20 if r.specificity == Specificity.HARD_NUMBERS else -0.05
        z += {
            Persuasion.NONE: -0.10,
            Persuasion.RECIPROCITY: 0.15,
            Persuasion.SOCIAL_PROOF_CASESTUDY: 0.20,
            Persuasion.SOCIAL_PROOF_STAT: 0.20,
            Persuasion.SOCIAL_PROOF_LOGOS: 0.10,
            Persuasion.AUTHORITY: 0.15,
            Persuasion.SCARCITY: -0.20,
            Persuasion.LIKING: 0.10,
            Persuasion.COMMITMENT: 0.10,
        }[r.persuasion]
        z += {
            Emotion.NONE: 0.0,
            Emotion.CURIOSITY: 0.10,
            Emotion.ASPIRATION: 0.05,
            Emotion.PAIN_RELIEF: 0.15,
            Emotion.STATUS: 0.0,
            Emotion.HUMOR: 0.05,
            Emotion.FOMO: -0.15,
        }[r.emotion]

        # ---- interaction effects (the reason for -q CA) ----
        ind, role, seq = c.industry, c.role_seniority, c.sequence_position
        if r.persuasion == Persuasion.SOCIAL_PROOF_CASESTUDY and ind == Industry.SAAS and seq == SequencePosition.EMAIL_2:
            z += 0.90
        if r.persuasion == Persuasion.SOCIAL_PROOF_STAT and ind == Industry.FINANCE:
            z += 0.50
        if r.emotion == Emotion.HUMOR and ind == Industry.HEALTHCARE:
            z -= 0.60
        if r.persuasion == Persuasion.AUTHORITY and role == RoleSeniority.C_LEVEL:
            z += 0.50
        if r.body_length == BodyLength.LONG and role == RoleSeniority.VP:
            z -= 0.60
        if r.persuasion == Persuasion.SCARCITY and seq == SequencePosition.EMAIL_1:
            z -= 0.50
        if r.persuasion == Persuasion.SCARCITY and seq == SequencePosition.BREAKUP:
            z += 0.30  # the one place mild scarcity helps replies
        pref = PREFERRED_DAYPART_BY_TZ[c.geo_timezone]
        if r.send_daypart.value == pref:
            z += 0.20
        if r.send_daypart.value == "offhours":
            z -= 0.30
        return z

    def _click_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.14)
        z += {CtaType.SOFT_REPLY: -0.30, CtaType.BOOK_LINK: 0.25, CtaType.RESOURCE_LINK: 0.30}[r.cta_type]
        z += {LinkCount.ZERO: -0.50, LinkCount.ONE: 0.20, LinkCount.TWO_PLUS: 0.15}[r.link_count]
        if r.persuasion == Persuasion.SCARCITY:
            z += 0.30  # trap: lifts clicks...
        if r.emotion == Emotion.FOMO:
            z += 0.30  # ...but tanks the objective via penalties
        if r.specificity == Specificity.HARD_NUMBERS:
            z += 0.10
        if r.cta_placement == CtaPlacement.BOTH:
            z += 0.10
        return z

    def _pos_sentiment_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.55)
        z += {
            PersonalizationDepth.GENERIC: -0.60,
            PersonalizationDepth.MERGE_FIELD: -0.10,
            PersonalizationDepth.SEGMENT_TAILORED: 0.20,
            PersonalizationDepth.ONE_TO_ONE_RESEARCHED: 0.50,
        }[r.personalization_depth]
        if r.persuasion == Persuasion.SCARCITY:
            z -= 0.50
        if r.emotion == Emotion.FOMO:
            z -= 0.50
        if r.sender_type == SenderType.PERSONAL:
            z += 0.20
        return z

    def _neg_sentiment_logit(self, r: Recipe, c: Context) -> float:
        """P(negative | reply is not positive)."""
        z = _logit(0.30)
        if r.persuasion == Persuasion.SCARCITY:
            z += 0.60
        if r.emotion == Emotion.FOMO:
            z += 0.60
        if r.personalization_depth == PersonalizationDepth.GENERIC:
            z += 0.50
        if r.subject_emoji:
            z += 0.20
        return z

    def _meeting_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.45)
        z += {CtaType.SOFT_REPLY: 0.0, CtaType.BOOK_LINK: 0.40, CtaType.RESOURCE_LINK: -0.10}[r.cta_type]
        if r.persuasion == Persuasion.AUTHORITY and c.role_seniority == RoleSeniority.C_LEVEL:
            z += 0.30
        if r.personalization_depth == PersonalizationDepth.ONE_TO_ONE_RESEARCHED:
            z += 0.20
        return z

    def _unsub_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.006)
        if r.persuasion == Persuasion.SCARCITY:
            z += 1.00
        if r.emotion == Emotion.FOMO:
            z += 1.00
        if r.cta_count == CtaCount.TWO:
            z += 0.30
        if r.body_length == BodyLength.LONG:
            z += 0.30
        if r.personalization_depth == PersonalizationDepth.GENERIC:
            z += 0.60
        if r.subject_emoji:
            z += 0.20
        return z

    def _complaint_logit(self, r: Recipe, c: Context) -> float:
        z = _logit(0.0015)
        if r.persuasion == Persuasion.SCARCITY:
            z += 1.60
        if r.emotion == Emotion.FOMO:
            z += 1.60
        if r.subject_emoji:
            z += 0.60
        if r.link_count == LinkCount.TWO_PLUS:
            z += 0.50
        if r.format == Format.LIGHT_HTML:
            z += 0.30
        if r.personalization_depth == PersonalizationDepth.GENERIC:
            z += 0.50
        if r.persuasion == Persuasion.SCARCITY and c.sequence_position == SequencePosition.EMAIL_1:
            z += 0.80
        return z

    def logits(self, r: Recipe, c: Context) -> dict[str, float]:
        return {
            "open": self._open_logit(r, c),
            "click": self._click_logit(r, c),
            "reply": self._reply_logit(r, c),
            "pos": self._pos_sentiment_logit(r, c),
            "negsent": self._neg_sentiment_logit(r, c),
            "meeting": self._meeting_logit(r, c),
            "unsub": self._unsub_logit(r, c),
            "complaint": self._complaint_logit(r, c),
        }

    # ------------------------------------------------------- expectations (oracle) -
    def expected_probs(
        self,
        r: Recipe,
        c: Context,
        deliv_cfg: DeliverabilityConfig,
        domain_health: float = 1.0,
    ) -> dict[str, float]:
        """Noise-free expected outcome probabilities (the oracle's view)."""
        L = self.logits(r, c)
        dist = deliverability.placement_distribution(r, deliv_cfg, domain_health)
        exposure = P_DELIVERED * sum(
            dist[p] * deliverability.open_multiplier(p, deliv_cfg) for p in dist
        )
        p_open_inbox = sigmoid(L["open"])
        eff_open = p_open_inbox * exposure
        p_reply = eff_open * sigmoid(L["reply"])
        p_click = eff_open * sigmoid(L["click"])
        p_pos = sigmoid(L["pos"])
        p_reply_pos = p_reply * p_pos
        p_neg = (1.0 - p_pos) * sigmoid(L["negsent"])
        p_negreply = p_reply * p_neg
        p_meeting = p_reply_pos * sigmoid(L["meeting"]) if c.intent == Intent.BOOK_MEETING else 0.0
        return {
            "exposure": exposure,
            "open": eff_open,
            "click": p_click,
            "reply": p_reply,
            "reply_positive": p_reply_pos,
            "negative_reply": p_negreply,
            "meeting": p_meeting,
            "unsubscribe": exposure * sigmoid(L["unsub"]),
            "spam_complaint": exposure * sigmoid(L["complaint"]),
        }

    def expected_score(self, r: Recipe, c: Context, weights, deliv_cfg: DeliverabilityConfig) -> float:
        """Expected objective for a recipe+context under a healthy domain (decay=0)."""
        p = self.expected_probs(r, c, deliv_cfg, domain_health=1.0)
        conv = weights.w_reply * p["reply_positive"] + weights.w_click * p["click"]
        if c.intent == Intent.BOOK_MEETING:
            conv += weights.w_meeting * p["meeting"]
        penalty = (
            weights.w_unsub * p["unsubscribe"]
            + weights.w_complaint * p["spam_complaint"]
            + weights.w_negreply * p["negative_reply"]
        )
        return conv - penalty
