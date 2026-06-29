# Plane 2 — Context (inputs)

Observed at send time. The AI adapts to these; it does not control them.

Context is split by **entity** so each table owns one kind of truth:

| Entity | What it represents | Changes how often |
|--------|-------------------|-------------------|
| **Contact** | Who the person is | Rarely |
| **Contact profile** | Where they are, what industry, B2B role | Slowly (optional) |
| **Email context** | Situation frozen at this specific send | Once per email |

`email_context` is the **single send-time snapshot** of all Plane 2 inputs. Copy profile and contact fields onto this row at send — do not rely on joins to `contact` / `contact_profile` for learning; those tables can change later.

---

## Sparse context (cold / first touch)

Most real sends will **not** have a full CRM picture. Cold outbound is the default case, not the exception.

| Situation | What you usually have | What is missing |
|-----------|----------------------|-----------------|
| **Cold first email** | `email`, maybe `name` | signup, purchases, engagement history, often firmographics |
| **List import** | email, name, sometimes company/role from vendor | verified geo, real segment, consent timing |
| **Competitor / pasted email** | message content, maybe `to_email` | contact may not exist; no profile at all |
| **Lifecycle / CRM** | rich contact + profile + history | rare for this project's learning use case |

**Design rules:**

1. **Almost every field is nullable.** Unknown is `null`, not a guessed default — except segment (see below).
2. **`contact_profile` is optional** (0..1). No row is valid for cold prospects.
3. **`contact_id` on `email_message` is optional.** You can ingest an email before you know anything about the recipient.
4. **`null` ≠ `0`.** `prior_opens = 0` means "we sent before and they never opened." `null` means "we don't know / first send in our system."
5. **Default segment when unknown:** `cold_prospect`. That is an explicit label for "no relationship yet," not missing data.
6. **The model must handle partial context.** Learning still works on interactions where only `segment_at_send` + timing + email content exist; richer context is a bonus when available.

### First-touch `email_context` (typical cold send)

| Field | Typical value |
|-------|----------------|
| `segment_at_send` | `cold_prospect` |
| `prior_opens` | `0` or `null` (use `0` once contact exists in system; `null` if pre-contact ingest) |
| `prior_clicks` | `0` or `null` |
| `prior_replies` | `0` or `null` |
| `lifetime_emails_received` | `0` |
| `days_since_last_engagement` | `null` |
| `last_engagement_type` | `null` |
| `days_since_signup` | `null` (never subscribed) |
| `days_since_last_purchase` | `null` |
| `days_since_previous_send` | `null` (no prior send) |
| `sequence_number` | `1`, `is_first_touch = true` |
| `industry` … `language` | all `null` |
| `lead_source_at_send` | `null` |
| `day_of_week` / `hour_local` | from `sent_at`; `hour_local` null without timezone |
| `hour_utc` | from `sent_at` (always derivable) |

---

## Contact

Identity and classification inputs that describe the recipient. A row can be created with **only an email** on first cold touch; enrich later when data arrives.

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `email` | yes | text | Primary identifier — often all you have |
| `name` | no | text | Display / merge-field name |
| `brand` | no | text | Sending brand or list owner (if multi-brand) |
| `customer_segment` | no | text | Defaults to `cold_prospect` when unknown |
| `lead_source` | no | text | `outbound`, `import`, `organic`, `referral`, … — null for pure cold |
| `signup_at` | no | timestamptz | null if never subscribed (typical for cold) |
| `last_purchase_at` | no | timestamptz | null if never purchased |
| `external_id` | no | text | Client CRM / ESP contact id — for import matching |
| `extras` | no | jsonb | Any other CRM fields from export |

### `customer_segment` values (2.1)

- `cold_prospect`
- `warm_lead`
- `trial_active`
- `trial_expiring`
- `first_time_buyer`
- `repeat` (2–5 purchases)
- `vip` (5+ purchases or high LTV)
- `churned` (90d+ inactive)
- `win_back` (6mo+ since churn)
- `referral_source`
- `partner_affiliate`
- `investor_advisor`

---

## Contact profile

Slow-changing attributes about the person and their organization. **Optional** — one row per contact when data exists; skip entirely for cold unknowns.

All fields nullable. Partial profiles are normal (e.g. only `company_name` from list vendor).

### Industry / vertical (2.2)

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `industry` | no | text | Taxonomy: `saas`, `ecommerce`, `agency`, … — null if unknown |
| `industry_other` | no | text | Free-text when taxonomy doesn't fit |

### Firmographics — B2B (2.3)

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `company_name` | no | text | Often the only firmographic on a cold list |
| `company_size` | no | text | e.g. `1-10`, `11-50`, `51-200`, `201-1000`, `1000+` |
| `role` | no | text | Job title or function |
| `seniority` | no | text | e.g. `ic`, `manager`, `director`, `vp`, `c_level`, `founder` |
| `department` | no | text | e.g. `engineering`, `marketing`, `sales`, `ops`, `finance`, `hr` |

### Geo (2.4)

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `country` | no | text | ISO country code or name |
| `timezone` | no | text | IANA timezone — null is common; infer `hour_local` from send time or leave null |
| `language` | no | text | ISO 639-1, e.g. `en`, `es`, `de` |
| `extras` | no | jsonb | Vendor-specific profile fields |

---

## Email context

One row per `email_message`. **Complete Plane 2 snapshot at send** — always created, even when sparse.

FK: `message_id` → `email_message(id)`

`contact` and `contact_profile` are the **source** for many fields; `email_context` is the **frozen copy** used for learning.

### Segment at send (2.1)

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `segment_at_send` | yes | text | Default `cold_prospect`. Same taxonomy as `customer_segment` |

### Profile snapshot at send (2.2 – 2.4)

Copied from `contact_profile` (and export) at send. All nullable.

| Input | Plane | Type | Values / notes |
|-------|-------|------|----------------|
| `industry` | 2.2 | text | `saas`, `ecommerce`, `agency`, … |
| `industry_other` | 2.2 | text | Free-text vertical when taxonomy doesn't fit |
| `company_name` | 2.3 | text | |
| `company_size` | 2.3 | text | `1-10`, `11-50`, `51-200`, `201-1000`, `1000+` |
| `role` | 2.3 | text | Job title or function |
| `seniority` | 2.3 | text | `ic`, `manager`, `director`, `vp`, `c_level`, `founder` |
| `department` | 2.3 | text | `engineering`, `marketing`, `sales`, … |
| `country` | 2.4 | text | ISO code or name |
| `timezone` | 2.4 | text | IANA, e.g. `America/New_York` |
| `language` | 2.4 | text | ISO 639-1 |

### Engagement history at send (2.5)

Rollup **before** this send. Often the strongest predictor.

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `lead_source_at_send` | no | text | Copied from `contact.lead_source` — how they entered the list |
| `prior_opens` | no | integer | `0` = sent before, never opened; `null` = unknown |
| `prior_clicks` | no | integer | same semantics |
| `prior_replies` | no | integer | same semantics |
| `prior_bounces` | no | integer | Hard/soft bounces before this send |
| `lifetime_emails_received` | no | integer | `0` on first send |
| `days_since_last_engagement` | no | integer | null if never engaged |
| `last_engagement_at` | no | timestamptz | Precise recency (source for days_since) |
| `last_engagement_type` | no | text | `open`, `click`, `reply`, or null |

### Send timing (2.6)

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `sent_at` | yes | timestamptz | Also on `email_message` |
| `day_of_week` | no | text | `mon` … `sun` |
| `hour_local` | no | integer | 0–23 recipient timezone — null without `timezone` |
| `hour_utc` | no | integer | 0–23 UTC — always derivable from `sent_at` |
| `days_since_signup` | no | integer | null if never subscribed |
| `days_since_last_purchase` | no | integer | null if never purchased |
| `days_since_previous_send` | no | integer | Cadence gap since last email to this contact |

### Sequence / cadence (derived at send)

Not in PLANE_GUIDE verbatim but required for learning ("email 2 in SaaS").

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `sequence_number` | no | integer | 1 = first email to contact in system, 2, 3, … |
| `is_first_touch` | no | boolean | `true` when `sequence_number = 1` |

### Snapshot provenance

| Input | Required | Type | Values / notes |
|-------|----------|------|----------------|
| `engagement_snapshot_known` | yes | boolean | `true` when `prior_*` computed from `email_metrics` replay |
| `profile_snapshot_known` | yes | boolean | `true` when industry/geo/firmographics copied at send |
| `extras` | no | jsonb | ESP audience id, list name, consent flags, etc. |

---

## Entity relationships

```
contact (optional — email_message.contact_id nullable)
  └── contact_profile   (0..1, optional)
  └── email_message     (1:n)
        └── email_context   (1:1, always)
```

**Read order at send time:**

1. Use whatever exists: **contact** (maybe email only), **contact_profile** (maybe absent)
2. Always write **email_context** — copy profile snapshot, segment, engagement, timing, sequence
3. Enrich contact/profile later when replies, enrichment APIs, or CRM sync add data
4. Then (later) derive Plane 1 features and record Plane 4 outcomes

---

## Bulk historical import ("here are all our old emails")

A client hands over years of ESP exports (Klaviyo, Mailchimp, CSV, Gmail). The schema supports **every combination** of completeness:

| What the export contains | Where it lands |
|--------------------------|----------------|
| Email body, subject, sent date | `email_message` |
| Provider message id | `email_message.message_id` + dedupe index |
| Recipient email / name | `contact` (upsert by `brand` + `email`) |
| CRM contact id | `contact.external_id` |
| Segment, signup date, lead source | `contact` columns |
| Company, role, geo | `contact_profile` (create or merge) |
| Anything else from the export | `raw` / `extras` jsonb on the relevant row |

### Import flow

```
for each row in export (ideally sorted by sent_at per recipient):
  a. upsert contact from to_email + any CRM fields
  b. upsert contact_profile if firmographics/geo present
  c. insert email_message (skip duplicates via source + message_id)
  d. insert email_context:
       - segment_at_send from export or contact.customer_segment or 'cold_prospect'
       - copy profile fields → industry, company_size, role, country, …
       - lead_source_at_send from contact.lead_source
       - timing from sent_at; hour_utc always; hour_local if timezone known
       - sequence_number, is_first_touch, days_since_previous_send from contact history
       - prior_* from replaying email_metrics chronologically when possible
       - engagement_snapshot_known / profile_snapshot_known when data is trusted
```

### What works with zero extra data

Minimum viable row: `email_message` with subject/body + `email_context` with `sent_at` and `segment_at_send = 'cold_prospect'`. No contact, no profile — valid.

### What needs a second pass

Accurate `prior_opens` / `prior_clicks` on historical mail requires either:

- importing in chronological order per contact and replaying counts, or
- `email_metrics` (Plane 4) per message and a backfill job

Until then, leave engagement fields `null` and `engagement_snapshot_known = false`. The schema holds the columns; the import pipeline fills them when it can.

### Dedup

`unique (source, message_id)` on `email_message` prevents loading the same Klaviyo export twice. Rows without a provider id rely on application-level dedup or hash in `extras`.

---

## Not in Plane 2

These belong to other planes — do not mix them into context tables:

| Plane | Examples |
|-------|----------|
| 1 Features | subject line, CTA, offer, copy framework |
| 3 Deliverability (pre-send) | SPF/DKIM, spam score, warmup — tunable like Plane 1 |
| 4 Outcomes | opened, clicked, converted, unsubscribed → `email_metrics` |
| 5 Experimentation | variant ID, bandit arm |
| 6 Guardrails | frequency caps, suppression |

Outcomes (Plane 4) live in **`email_metrics`**. They are the source for computing the next send's `prior_opens`, `prior_clicks`, etc. Context reads history before send; metrics record what happened after.
