# Plane 1 — Features

**Role:** Levers the AI chooses and optimizes.

**Status:** **Partial** — `email_analysis` table exists; many tags still missing as columns.

**Table:** `email_analysis` (1:1 with `email_message`)

Applies to **past and present** emails. Tag from rules, ESP metadata, or AI on subject/body. Backfill when `email_metrics` arrives (e.g. sequence position, previous outcome).

---

## Tag groups (from PLANE_GUIDE)

### 1.1 Campaign type

cold outreach · newsletter · lifecycle · promotional · transactional · nurture-drip · website-triggered · list-building

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `campaign_type` | In DB |

### 1.2 Intent

book meeting · drive purchase · get reply · click-to-page · activate · upsell · renew · re-engage · collect-info · referral · pure-value

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `intent` | In DB |

### 1.3 Subject line

length · personalization token · type · urgency · number · emoji · casing

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `subject_type` | Partial |
| ✅ | `has_urgency` | Partial |
| ✅ | `has_emoji` | Partial |
| ✅ | `has_personalization` | Partial |
| ❌ | — | length, number, casing not in DB |

### 1.4 Preheader

present · length · complements vs repeats subject

| Schema | Status |
|--------|--------|
| ❌ | Raw `preheader` on `email_message` only — no analysis columns |

### 1.5 Sender

name type · identity used · reply-to set

| Schema | Status |
|--------|--------|
| ❌ | Raw `from_name`, `from_email`, `reply_to` on `email_message` — no analysis columns |

### 1.6 Body

length bucket · plain vs HTML · image:text ratio · link count · reading grade · scannable

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `body_length` | Partial (bucket only) |
| ❌ | — | format, images, links, grade, scannable |

### 1.7 Copy strategy

author style · framework · persuasion · emotion · social proof · specificity · personalization depth

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `framework` | In DB |
| ✅ | `persuasion[]` | In DB |
| ✅ | `emotion[]` | In DB |
| ✅ | `social_proof` | In DB |
| ❌ | — | author style, specificity, personalization depth |

### 1.8 CTA

count · type · placement · style · copy

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `cta_type` | Partial |
| ✅ | `cta_count` | Partial |
| ❌ | — | placement, style, copy text |

### 1.9 Offer

has offer · type · magnitude · scarcity · guarantee

| Schema | Column | Status |
|--------|--------|--------|
| ✅ | `has_offer` | Partial |
| ✅ | `offer_type` | Partial |
| ❌ | — | magnitude, scarcity, guarantee |

### 1.10 Sequence position

position · previous outcome · days since previous · new thread vs reply

| Schema | Status |
|--------|--------|
| ⚠️ | Partially on `email_context` (`sequence_number`, `is_first_touch`, `days_since_previous_send`) — contextual, not copy tags |

---

## Overflow

| Column | Purpose |
|--------|---------|
| `extras` | jsonb for tags without a column yet |
| `updated_at` | Bumps on backfill / re-tag |

---

## Not in Plane 1

| Plane | Where |
|-------|--------|
| 2 Context | `email_context` |
| 3 Deliverability (pre-send) | Future table |
| 4 Outcomes | `email_metrics` |
| 5 Experimentation | Future table |
| 6 Guardrails | Config / rules engine |
