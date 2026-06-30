"""Deterministic sampling of context, analysis, and metrics (no AI)."""

from __future__ import annotations

import json
import math
import random
from datetime import datetime, timedelta, timezone
from typing import Any
from zoneinfo import ZoneInfo

import config


def allocate_combos(n: int, rng: random.Random) -> list[tuple[str, str, str]]:
    """Assign each row a valid (segment, campaign_type, intent) triple."""
    triples = config.VALID_TRIPLES
    min_per = config.MIN_EXAMPLES_PER_COMBO
    if len(triples) * min_per > n:
        min_per = max(1, n // len(triples))

    assignments: list[tuple[str, str, str]] = []
    for triple in triples:
        for _ in range(min_per):
            assignments.append(triple)

    # Fill remainder with segment-weighted random triples
    segments = list(config.SEGMENT_WEIGHTS.keys())
    weights = [config.SEGMENT_WEIGHTS[s] for s in segments]
    triples_by_segment: dict[str, list[tuple[str, str, str]]] = {}
    for t in triples:
        triples_by_segment.setdefault(t[0], []).append(t)

    while len(assignments) < n:
        seg = rng.choices(segments, weights=weights, k=1)[0]
        pool = triples_by_segment.get(seg, triples)
        assignments.append(rng.choice(pool))

    rng.shuffle(assignments)
    return assignments[:n]


def allocate_tiers(n: int, rng: random.Random) -> list[str]:
    """Assign outcome tiers: ~1/3 success, failure, mixed."""
    tiers = config.OUTCOME_TIERS
    base = n // 3
    remainder = n - base * 3
    result = [tiers[0]] * base + [tiers[1]] * base + [tiers[2]] * base
    for i in range(remainder):
        result.append(tiers[i])
    rng.shuffle(result)
    return result


def _pick_company_name(rng: random.Random) -> str:
    return f"{rng.choice(config.COMPANY_PREFIXES)} {rng.choice(config.COMPANY_SUFFIXES)}"


def _pick_contact_name(rng: random.Random) -> str:
    return f"{rng.choice(config.FIRST_NAMES)} {rng.choice(config.LAST_NAMES)}"


def _engagement_profile(segment: str, rng: random.Random) -> dict[str, Any]:
    """Sample prior engagement fields correlated with segment."""
    profiles = {
        "cold_prospect": (0, 3, 0, 1, 0, 1, 5, 45),
        "warm_lead": (2, 12, 0, 2, 1, 3, 14, 120),
        "trial_active": (5, 20, 1, 3, 2, 8, 7, 90),
        "trial_expiring": (8, 25, 2, 4, 3, 12, 5, 60),
        "first_time_buyer": (3, 15, 1, 2, 2, 6, 10, 180),
        "repeat": (15, 45, 3, 8, 5, 25, 3, 365),
        "vip": (30, 80, 8, 12, 10, 50, 2, 500),
        "churned": (5, 12, 1, 6, 4, 15, 60, 400),
        "win_back": (3, 8, 0, 5, 3, 10, 90, 300),
        "referral_source": (4, 14, 1, 2, 2, 7, 12, 200),
        "partner_affiliate": (6, 18, 2, 3, 3, 10, 8, 250),
        "investor_advisor": (2, 10, 1, 1, 1, 5, 20, 180),
    }
    lo_o, hi_o, lo_c, hi_c, lo_r, hi_r, lo_days, hi_days = profiles.get(
        segment, profiles["warm_lead"]
    )
    prior_opens = rng.randint(lo_o, hi_o)
    click_hi = max(lo_c, min(hi_c, prior_opens))
    prior_clicks = rng.randint(lo_c, click_hi)
    reply_hi = min(hi_r, prior_clicks)
    if reply_hi < lo_r:
        prior_replies = reply_hi
    else:
        prior_replies = rng.randint(lo_r, reply_hi)
    prior_bounces = rng.randint(0, 2) if segment in ("cold_prospect", "churned") else rng.randint(0, 1)
    lifetime = rng.randint(max(1, prior_opens), max(prior_opens + 5, hi_r * 3))
    days_since = rng.randint(lo_days, hi_days) if prior_opens > 0 else None

    last_type = "none"
    last_at = None
    if prior_replies > 0:
        last_type = "reply"
    elif prior_clicks > 0:
        last_type = "click"
    elif prior_opens > 0:
        last_type = "open"

    if last_type != "none" and days_since is not None:
        last_at = datetime.now(timezone.utc) - timedelta(days=days_since)

    return {
        "prior_opens": prior_opens,
        "prior_clicks": prior_clicks,
        "prior_replies": prior_replies,
        "prior_bounces": prior_bounces,
        "lifetime_emails_received": lifetime,
        "days_since_last_engagement": days_since,
        "last_engagement_at": last_at.isoformat() if last_at else None,
        "last_engagement_type": last_type,
    }


def _sample_timing(
    segment: str, tier: str, rng: random.Random, *, language_only: str | None = None
) -> dict[str, Any]:
    locales = config.COUNTRIES_TZ
    if language_only:
        locales = [e for e in locales if e[2] == language_only]
        if not locales:
            locales = config.COUNTRIES_TZ_ENGLISH
    country, tz_name, language = rng.choice(locales)
    tz = ZoneInfo(tz_name)

    days_ago = rng.randint(1, 540)
    sent_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
    sent_at = sent_at.replace(
        hour=rng.randint(0, 23),
        minute=rng.randint(0, 59),
        second=rng.randint(0, 59),
        microsecond=0,
    )

    local = sent_at.astimezone(tz)
    hour_local = local.hour

    # Bad timing more likely for failure/mixed tiers
    if tier in ("failure", "mixed") and rng.random() < 0.45:
        hour_local = rng.choice([0, 1, 2, 3, 4, 5, 22, 23])
        local = local.replace(hour=hour_local)
        sent_at = local.astimezone(timezone.utc)
    elif tier == "success" and rng.random() < 0.75:
        hour_local = rng.randint(8, 17)
        local = local.replace(hour=hour_local, minute=rng.randint(0, 59))
        sent_at = local.astimezone(timezone.utc)

    day_of_week = config.DAYS_OF_WEEK[local.weekday()]

    days_since_signup = None
    days_since_last_purchase = None
    if segment in ("cold_prospect",):
        days_since_signup = None
    elif segment in ("warm_lead", "trial_active", "trial_expiring"):
        days_since_signup = rng.randint(3, 90)
    else:
        days_since_signup = rng.randint(30, 800)

    if segment in ("first_time_buyer", "repeat", "vip"):
        days_since_last_purchase = rng.randint(1, 180 if segment == "first_time_buyer" else 400)
    elif segment in ("churned", "win_back"):
        days_since_last_purchase = rng.randint(90, 500)
    else:
        days_since_last_purchase = None

    return {
        "country": country,
        "timezone": tz_name,
        "language": language,
        "sent_at": sent_at.isoformat(),
        "day_of_week": day_of_week,
        "hour_local": hour_local,
        "hour_utc": sent_at.hour,
        "days_since_signup": days_since_signup,
        "days_since_last_purchase": days_since_last_purchase,
    }


def _sample_sequence(segment: str, tier: str, engagement: dict, rng: random.Random) -> dict[str, Any]:
    if segment == "cold_prospect":
        seq = 1 if rng.random() < 0.7 else rng.randint(2, 4)
    elif segment in ("churned", "win_back"):
        seq = rng.randint(1, 3)
    else:
        seq = rng.randint(1, 8)

    if tier == "failure" and engagement["prior_opens"] == 0:
        seq = rng.randint(3, 6)

    is_first = seq == 1
    days_since_prev = None if is_first else rng.randint(2, 21)

    return {
        "sequence_number": seq,
        "is_first_touch": is_first,
        "days_since_previous_send": days_since_prev,
    }


def sample_context(
    segment: str,
    campaign_type: str,
    intent: str,
    tier: str,
    rng: random.Random,
    *,
    language_only: str | None = None,
) -> dict[str, Any]:
    sparse = segment == "cold_prospect" and rng.random() < 0.35

    industry = None if sparse else rng.choice(config.INDUSTRIES)
    company_name = None if sparse else _pick_company_name(rng)
    company_size = None if sparse else rng.choice(config.COMPANY_SIZES)
    department = None if sparse else rng.choice(config.DEPARTMENTS)
    role = None if sparse else rng.choice(config.ROLES_BY_DEPT.get(department or "other", ["Manager"]))
    seniority = None if sparse else rng.choice(config.SENIORITIES)

    engagement = _engagement_profile(segment, rng)
    timing = _sample_timing(segment, tier, rng, language_only=language_only)
    sequence = _sample_sequence(segment, tier, engagement, rng)

    lead_source = rng.choice(config.LEAD_SOURCES)
    if segment == "referral_source":
        lead_source = "referral"
    elif segment == "partner_affiliate":
        lead_source = "partner"
    elif segment == "cold_prospect":
        lead_source = rng.choice(["cold_import", "paid_search", "content_download"])

    ctx = {
        "segment_at_send": segment,
        "industry": industry,
        "company_name": company_name,
        "company_size": company_size,
        "role": role,
        "seniority": seniority,
        "department": department,
        "lead_source_at_send": lead_source,
        **engagement,
        **timing,
        **sequence,
        "_contact_name": _pick_contact_name(rng),
        "_product_name": rng.choice(config.PRODUCT_NAMES),
    }
    return ctx


def _target_craft_for_tier(tier: str, rng: random.Random) -> float:
    if tier == "success":
        return rng.uniform(0.65, 0.95)
    if tier == "failure":
        return rng.uniform(0.15, 0.45)
    return rng.uniform(0.40, 0.70)


def sample_analysis(
    segment: str,
    campaign_type: str,
    intent: str,
    tier: str,
    context: dict[str, Any],
    rng: random.Random,
) -> dict[str, Any]:
    craft_target = _target_craft_for_tier(tier, rng)

    has_personalization = craft_target > 0.5 and rng.random() < 0.55 + (craft_target - 0.5)
    if segment == "cold_prospect" and rng.random() < 0.3:
        has_personalization = rng.random() < 0.4

    subject_type = rng.choice(config.SUBJECT_TYPES)
    if craft_target < 0.35:
        subject_type = rng.choice(["statement", "announcement"])

    has_urgency = craft_target < 0.4 and rng.random() < 0.5
    if tier == "failure" and rng.random() < 0.35:
        has_urgency = True
    if craft_target > 0.6 and intent in ("drive_purchase", "renew", "trial_expiring"):
        has_urgency = rng.random() < 0.4

    has_emoji = rng.random() < (0.15 if craft_target > 0.5 else 0.08)
    if campaign_type == "newsletter":
        has_emoji = rng.random() < 0.25

    if tier == "failure" and rng.random() < 0.25:
        cta_count = rng.randint(4, 5)
    else:
        cta_count = rng.choices([1, 2, 3], weights=[0.45, 0.40, 0.15], k=1)[0]

    length_weights = {
        "transactional": {"short": 0.6, "medium": 0.35, "long": 0.05},
        "newsletter": {"short": 0.05, "medium": 0.35, "long": 0.6},
        "cold_outreach": {"short": 0.5, "medium": 0.45, "long": 0.05},
    }
    lw = length_weights.get(campaign_type, {"short": 0.25, "medium": 0.55, "long": 0.20})
    body_length = rng.choices(
        list(lw.keys()), weights=list(lw.values()), k=1
    )[0]

    framework = rng.choice(config.FRAMEWORKS)
    if craft_target < 0.3:
        framework = rng.choice(["none", "aida"])

    n_persuasion = rng.randint(1, 3)
    persuasion = rng.sample(config.PERSUASION_TAGS, n_persuasion)
    n_emotion = rng.randint(1, 2)
    emotion = rng.sample(config.EMOTION_TAGS, n_emotion)

    social_proof = rng.choice(config.SOCIAL_PROOF_TYPES)
    if craft_target > 0.6:
        social_proof = rng.choice(["testimonial", "case_study", "hard_stat", "user_count"])

    cta_type = {
        "book_meeting": "book",
        "drive_purchase": "buy",
        "get_reply": "reply",
        "click_to_page": "read",
        "activate": "read",
        "upsell": "buy",
        "renew": "buy",
        "re_engage": "read",
        "collect_info": "download",
        "referral": "read",
        "pure_value": "read",
    }.get(intent, "read")

    promo_segments = ("trial_expiring", "win_back", "churned", "first_time_buyer")
    has_offer = campaign_type in ("promotional", "website_triggered") or segment in promo_segments
    has_offer = has_offer and rng.random() < 0.7
    offer_type = rng.choice(config.OFFER_TYPES) if has_offer else None

    analysis = {
        "campaign_type": campaign_type,
        "intent": intent,
        "subject_type": subject_type,
        "has_urgency": has_urgency,
        "has_emoji": has_emoji,
        "has_personalization": has_personalization,
        "body_length": body_length,
        "framework": framework,
        "persuasion": persuasion,
        "emotion": emotion,
        "social_proof": social_proof,
        "cta_type": cta_type,
        "cta_count": cta_count,
        "has_offer": has_offer,
        "offer_type": offer_type,
        "_craft_target": craft_target,
    }
    return analysis


def compute_craft_score(context: dict[str, Any], analysis: dict[str, Any]) -> float:
    """Hidden quality score in [0, 1] — not exported."""
    score = analysis.get("_craft_target", 0.5)

    if analysis.get("has_personalization"):
        score += 0.08
    if analysis.get("subject_type") in ("curiosity_gap", "question"):
        score += 0.05
    if analysis.get("framework") != "none":
        score += 0.04
    if analysis.get("social_proof") != "none":
        score += 0.04

    hour = context.get("hour_local", 12)
    if 8 <= hour <= 18:
        score += 0.06
    else:
        score -= 0.12

    prior_opens = context.get("prior_opens") or 0
    if prior_opens > 10:
        score += 0.05
    elif prior_opens == 0:
        score -= 0.04

    cta_count = analysis.get("cta_count", 1)
    if cta_count >= 4:
        score -= 0.15
    elif cta_count == 1:
        score += 0.03

    seq = context.get("sequence_number") or 1
    if seq >= 4 and (context.get("prior_opens") or 0) == 0:
        score -= 0.10

    persuasion = analysis.get("persuasion") or []
    if analysis.get("has_urgency") and "scarcity" in persuasion:
        score -= 0.08

    return max(0.0, min(1.0, score))


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _roll_bool(prob: float, rng: random.Random) -> bool:
    return rng.random() < max(0.0, min(1.0, prob))


def sample_metrics(
    context: dict[str, Any],
    analysis: dict[str, Any],
    tier: str,
    rng: random.Random,
    surprise: bool = False,
) -> dict[str, Any]:
    segment = context["segment_at_send"]
    craft = compute_craft_score(context, analysis)
    ceiling = config.SEGMENT_OPEN_CEILING.get(segment, 0.4)

    tier_shift = {"success": 0.25, "failure": -0.25, "mixed": 0.0}[tier]
    if surprise:
        tier_shift = -tier_shift * 0.8
        craft = 1.0 - craft if tier == "success" else craft + 0.3

    open_logit = -1.2 + craft * 2.0 + ceiling * 1.5 + tier_shift
    if (context.get("prior_opens") or 0) > 5:
        open_logit += 0.3
    if context.get("hour_local", 12) < 7 or context.get("hour_local", 12) > 21:
        open_logit -= 0.5

    p_open = _sigmoid(open_logit) * ceiling / 0.5
    p_open = max(0.02, min(0.85, p_open))

    delivered = _roll_bool(0.97 if segment != "cold_prospect" else 0.92, rng)
    bounce_type = None
    if not delivered:
        bounce_type = rng.choice(["hard", "soft"])

    opened = False
    opened_at = None
    time_to_open = None
    clicked = False
    clicked_at = None
    replied = False
    reply_sentiment = None
    forwarded = False
    goal_completed = False
    converted_at = None
    revenue = None
    order_value = None
    unsubscribed = False
    spam_complaint = False
    hard_block = False
    negative_reply = False
    placement = "primary"

    if delivered:
        if bounce_type is None:
            placement = rng.choices(
                ["primary", "promotions", "spam"],
                weights=[0.82, 0.14, 0.04],
                k=1,
            )[0]
            if craft < 0.3 and analysis.get("has_urgency"):
                placement = rng.choices(
                    ["primary", "promotions", "spam"],
                    weights=[0.5, 0.3, 0.2],
                    k=1,
                )[0]

        opened = _roll_bool(p_open, rng)
        if opened:
            sent = datetime.fromisoformat(context["sent_at"])
            delay_sec = int(rng.expovariate(1 / 3600) + rng.randint(60, 7200))
            opened_at = (sent + timedelta(seconds=delay_sec)).isoformat()
            time_to_open = delay_sec

            click_logit = -0.8 + craft * 1.8 + tier_shift * 0.8
            if analysis.get("cta_count", 1) >= 4:
                click_logit -= 0.4
            p_click = _sigmoid(click_logit) * 0.45
            clicked = _roll_bool(p_click, rng)

            if clicked:
                clicked_at = (
                    datetime.fromisoformat(opened_at) + timedelta(seconds=rng.randint(30, 600))
                ).isoformat()

                reply_logit = -1.5 + craft * 1.5 + tier_shift
                if analysis.get("intent") == "get_reply":
                    reply_logit += 0.8
                p_reply = _sigmoid(reply_logit) * 0.2
                replied = _roll_bool(p_reply, rng)

                reply_without_click = False
                if not replied and rng.random() < 0.05:
                    replied = _roll_bool(p_reply * 0.5, rng)
                    reply_without_click = replied

                if replied:
                    sentiments = ["positive", "neutral", "negative"]
                    weights = [0.5, 0.35, 0.15]
                    if tier == "failure":
                        weights = [0.2, 0.35, 0.45]
                    reply_sentiment = rng.choices(sentiments, weights=weights, k=1)[0]
                    negative_reply = reply_sentiment == "negative"

                convert_logit = -2.0 + craft * 2.2 + tier_shift
                if analysis.get("intent") in ("drive_purchase", "upsell", "renew", "activate"):
                    convert_logit += 0.6
                p_convert = _sigmoid(convert_logit) * 0.25
                goal_completed = _roll_bool(p_convert, rng)

                if goal_completed:
                    converted_at = (
                        datetime.fromisoformat(clicked_at) + timedelta(seconds=rng.randint(60, 86400))
                    ).isoformat()
                    if analysis.get("intent") in ("drive_purchase", "upsell", "renew"):
                        order_value = round(rng.uniform(29, 2500), 2)
                        revenue = order_value

                forwarded = _roll_bool(0.03 + craft * 0.05, rng)

    # Rare reply without click
    if delivered and opened and not clicked and not replied and rng.random() < 0.05:
        replied = _roll_bool(0.08, rng)
        if replied:
            reply_sentiment = rng.choice(["positive", "neutral", "negative"])
            negative_reply = reply_sentiment == "negative"

    neg_logit = -3.5 + (1 - craft) * 1.5 + tier_shift * -0.5
    if analysis.get("cta_count", 1) >= 4:
        neg_logit += 0.6
    if tier == "failure":
        neg_logit += 0.5
    unsubscribed = _roll_bool(_sigmoid(neg_logit) * 0.08, rng)
    spam_complaint = _roll_bool(_sigmoid(neg_logit) * 0.02, rng)
    hard_block = delivered and spam_complaint and rng.random() < 0.3

    return {
        "delivered": delivered,
        "bounce_type": bounce_type,
        "placement": placement if delivered else None,
        "opened": opened if delivered else False,
        "opened_at": opened_at,
        "time_to_open_seconds": time_to_open,
        "clicked": clicked if delivered else False,
        "clicked_at": clicked_at,
        "replied": replied if delivered else False,
        "reply_sentiment": reply_sentiment,
        "forwarded": forwarded if delivered else False,
        "goal_completed": goal_completed if delivered else False,
        "converted_at": converted_at,
        "revenue": revenue,
        "order_value": order_value,
        "unsubscribed": unsubscribed,
        "spam_complaint": spam_complaint,
        "hard_block": hard_block,
        "negative_reply": negative_reply,
    }


def _strip_internal(d: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in d.items() if not k.startswith("_")}


def sample_row(
    index: int,
    combo: tuple[str, str, str],
    tier: str,
    rng: random.Random,
    *,
    language_only: str | None = None,
) -> dict[str, Any]:
    segment, campaign_type, intent = combo
    surprise = rng.random() < 0.12

    context = sample_context(
        segment, campaign_type, intent, tier, rng, language_only=language_only
    )
    analysis = sample_analysis(segment, campaign_type, intent, tier, context, rng)
    metrics = sample_metrics(context, analysis, tier, rng, surprise=surprise)

    return {
        "context": _strip_internal(context),
        "analysis": _strip_internal(analysis),
        "metrics": metrics,
        "_index": index,
        "_contact_name": context.get("_contact_name"),
        "_product_name": context.get("_product_name"),
    }


def assert_funnel_invariants(metrics: dict[str, Any]) -> None:
    if metrics.get("clicked") and not metrics.get("opened"):
        raise ValueError("clicked without opened")
    if metrics.get("goal_completed") and not metrics.get("clicked"):
        if metrics.get("replied"):
            pass
        else:
            raise ValueError("goal_completed without clicked")
    if metrics.get("negative_reply") and metrics.get("reply_sentiment") != "negative":
        raise ValueError("negative_reply without negative sentiment")
    if not metrics.get("delivered") and metrics.get("opened"):
        raise ValueError("opened without delivered")


def _main() -> None:
    rng = random.Random(42)
    combos = allocate_combos(20, rng)
    tiers = allocate_tiers(20, rng)
    for i, (combo, tier) in enumerate(zip(combos, tiers)):
        row = sample_row(i, combo, tier, rng)
        assert_funnel_invariants(row["metrics"])
        print(
            f"Row {i}: {combo[0]} / {combo[1]} / {combo[2]} tier={tier} "
            f"open={row['metrics']['opened']} click={row['metrics']['clicked']}"
        )
    print("All funnel invariants passed.")


if __name__ == "__main__":
    _main()
