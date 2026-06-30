# Plane 2 — Context

**Role:** Observed at send time. The AI adapts to these; it does not control them.

**Status:** **Done** (schema). Import/backfill pipelines not built yet.

**Tables:** `contact`, `contact_profile`, `email_context`

`email_context` is the **frozen send-time snapshot** — copy profile and engagement fields here; do not rely on joins for learning.

---

## Entities

| Entity | Table | Purpose |
|--------|-------|---------|
| Contact | `contact` | Identity + lifecycle anchors |
| Profile | `contact_profile` | Industry, firmographics, geo (0..1) |
| Send snapshot | `email_context` | Full Plane 2 picture at this send |

```
contact
  └── contact_profile   (0..1)
  └── email_message
        └── email_context   (1:1, always)
```

---

## 2.1 Customer segment

**On contact:** `customer_segment`  
**At send:** `email_context.segment_at_send` (default `cold_prospect`)

Values: `cold_prospect`, `warm_lead`, `trial_active`, `trial_expiring`, `first_time_buyer`, `repeat`, `vip`, `churned`, `win_back`, `referral_source`, `partner_affiliate`, `investor_advisor`

| Status |
|--------|
| ✅ In DB |

---

## 2.2 Industry / vertical

**Source:** `contact_profile` → snapshot on `email_context`

| Column | Status |
|--------|--------|
| `industry` | ✅ |
| `industry_other` | ✅ |

---

## 2.3 Firmographics (B2B)

| Column | Status |
|--------|--------|
| `company_name` | ✅ |
| `company_size` | ✅ |
| `role` | ✅ |
| `seniority` | ✅ |
| `department` | ✅ |

---

## 2.4 Geo

| Column | Status |
|--------|--------|
| `country` | ✅ |
| `timezone` | ✅ |
| `language` | ✅ |

---

## 2.5 Engagement history (before this send)

| Column | Status |
|--------|--------|
| `lead_source_at_send` | ✅ |
| `prior_opens` | ✅ |
| `prior_clicks` | ✅ |
| `prior_replies` | ✅ |
| `prior_bounces` | ✅ |
| `lifetime_emails_received` | ✅ |
| `days_since_last_engagement` | ✅ |
| `last_engagement_at` | ✅ |
| `last_engagement_type` | ✅ |

Populated from `email_metrics` replay or chronological import. `engagement_snapshot_known` marks trusted snapshots.

---

## 2.6 Send timing

| Column | Status |
|--------|--------|
| `sent_at` | ✅ |
| `day_of_week` | ✅ |
| `hour_local` | ✅ |
| `hour_utc` | ✅ |
| `days_since_signup` | ✅ |
| `days_since_last_purchase` | ✅ |
| `days_since_previous_send` | ✅ |

---

## Sequence / cadence (derived)

| Column | Status |
|--------|--------|
| `sequence_number` | ✅ |
| `is_first_touch` | ✅ |

---

## Contact table (source fields)

| Column | Status |
|--------|--------|
| `email`, `name`, `brand` | ✅ |
| `customer_segment`, `lead_source` | ✅ |
| `signup_at`, `last_purchase_at` | ✅ |
| `external_id`, `extras` | ✅ |

---

## Sparse context (cold / first touch)

Almost every field nullable. No `contact_profile` row is valid. `email_context` always created — mostly nulls, `segment_at_send = cold_prospect`, `sequence_number = 1`.

---

## Bulk historical import

Upsert `contact` → copy profile → insert `email_message` → insert `email_context` with snapshot fields. Accurate `prior_*` needs chronological import or `email_metrics` backfill.

---

## Not in Plane 2

| Plane | Table |
|-------|--------|
| 1 Features | `email_analysis` |
| 3 Deliverability (pre-send) | — |
| 4 Outcomes | `email_metrics` |
| 5 / 6 | — |
