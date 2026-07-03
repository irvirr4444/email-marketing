# Plane 4 — Metrics (outcomes)

**Role:** What "works" means. Capture timestamps for everything.

**Status:** **Done** (schema). Event ingest and webhooks not built yet.

**Table:** `email_metrics` (1:1 with `email_message`)

Plane 3 **measured** deliverability lives here. Plane 2 `email_context.prior_*` is **backfilled** from this table chronologically per contact.
 
---

## Delivery

| Column | Status |
|--------|--------|
| `delivered` | ✅ |
| `bounce_type` | ✅ hard / soft |
| `placement` | ✅ primary / promotions / spam |

---

## Engagement

| Column | Status |
|--------|--------|
| `opened` | ✅ |
| `opened_at` | ✅ |
| `time_to_open_seconds` | ✅ |
| `clicked` | ✅ |
| `clicked_at` | ✅ |
| `clicked_link` | ✅ |
| `replied` | ✅ |
| `replied_at` | ✅ |
| `reply_sentiment` | ✅ positive / negative / neutral |
| `forwarded` | ✅ |
| `forwarded_at` | ✅ |

---

## Conversion

Judged against `email_analysis.intent` (Plane 1.2).

| Column | Status |
|--------|--------|
| `goal_completed` | ✅ |
| `converted_at` | ✅ |
| `revenue` | ✅ |
| `order_value` | ✅ |
| `time_to_convert_seconds` | ✅ |

---

## Negative

Weight equally with positive signals in the objective function.

| Column | Status |
|--------|--------|
| `unsubscribed` | ✅ |
| `unsubscribed_at` | ✅ |
| `spam_complaint` | ✅ |
| `spam_complaint_at` | ✅ |
| `hard_block` | ✅ |
| `negative_reply` | ✅ |

---

## Provenance

| Column | Purpose |
|--------|---------|
| `metrics_known` | `false` when ESP didn't provide stats |
| `extras` | Provider-specific event data |
| `updated_at` | Late-arriving events |

---

## Sparse metrics (historical import)

| Situation | Row state |
|-----------|-----------|
| ESP export with open/click | flags set, `metrics_known = true` |
| Content-only import | row exists, nulls, `metrics_known = false` |
| Events arrive later | update timestamps, `metrics_known = true` |

---

## Entity relationships

```
email_message
  ├── email_context
  ├── email_analysis
  └── email_metrics
```

---

## Objective function input

```
score = conversion_value − (unsubscribe + complaint + deliverability_decay penalties)
```

`email_metrics` supplies raw signals. Complaints weighted heavily.

---

