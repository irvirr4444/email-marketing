# Plane 4 — Metrics (outcomes)

What happened **after** the send. One row per `email_message` — past or present. This is how we score what worked.

Plane 3 (deliverability) is **not** here. Pre-send levers — spam score, SPF/DKIM, warmup, link count — are tunable inputs (like Plane 1). Only **measured** delivery results (`delivered`, `bounce_type`, `placement`) belong in metrics.

| Plane | Role | Table (now / later) |
|-------|------|---------------------|
| 1 Features | Levers the AI chooses | `email_analysis` |
| 2 Context | Observed input at send | `email_context` |
| 3 Deliverability (pre-send) | Tunable infrastructure & content risk | TBD (with features) |
| **4 Outcomes** | **What winning is measured against** | **`email_metrics`** |

`email_context` reads history **before** send. `email_metrics` records what happened **after** — and feeds the next send's `prior_opens`, `prior_clicks`, etc.

---

## email_metrics

FK: `message_id` → `email_message(id)` — 1:1, always creatable (nulls when unknown).

### Delivery

| Input | Type | Notes |
|-------|------|-------|
| `delivered` | boolean | |
| `bounce_type` | text | `hard`, `soft` |
| `placement` | text | `primary`, `promotions`, `spam` |

### Engagement

Capture timestamps for everything.

| Input | Type | Notes |
|-------|------|-------|
| `opened` | boolean | |
| `opened_at` | timestamptz | |
| `time_to_open_seconds` | integer | `opened_at` − send time |
| `clicked` | boolean | |
| `clicked_at` | timestamptz | |
| `clicked_link` | text | Which link if known |
| `replied` | boolean | |
| `replied_at` | timestamptz | |
| `reply_sentiment` | text | `positive`, `negative`, `neutral` |
| `forwarded` | boolean | |
| `forwarded_at` | timestamptz | |

### Conversion

Judged against intent (Plane 1.2 on `email_analysis`).

| Input | Type | Notes |
|-------|------|-------|
| `goal_completed` | boolean | Met the intent for this send |
| `converted_at` | timestamptz | |
| `revenue` | numeric | Attributed revenue |
| `order_value` | numeric | Single order if applicable |
| `time_to_convert_seconds` | integer | |

### Negative

Weight equally with positive signals in the objective function.

| Input | Type | Notes |
|-------|------|-------|
| `unsubscribed` | boolean | |
| `unsubscribed_at` | timestamptz | |
| `spam_complaint` | boolean | |
| `spam_complaint_at` | timestamptz | |
| `hard_block` | boolean | |
| `negative_reply` | boolean | |

### Provenance

| Input | Type | Notes |
|-------|------|-------|
| `metrics_known` | boolean | `false` when ESP didn't provide stats or only partial import |
| `extras` | jsonb | Provider-specific stats (open count, device, etc.) |

---

## Sparse metrics (historical import)

| Situation | Typical `email_metrics` row |
|-----------|----------------------------|
| ESP export with open/click flags | `opened`, `clicked` set; `metrics_known = true` |
| Content-only import | row exists, all nulls, `metrics_known = false` |
| Full event stream later | update `opened_at`, `clicked_at`, etc.; set `metrics_known = true` |

`updated_at` changes when late-arriving events are recorded.

---

## Entity relationships

```
email_message
  ├── email_context   (Plane 2 — before)
  ├── email_analysis  (Plane 1 — tags; AI, rules, or import)
  └── email_metrics   (Plane 4 — after)
```

**Backfill:** replay `email_metrics` chronologically per contact → populate `email_context.prior_*` and set `engagement_snapshot_known = true`.

---

## Objective function

```
score = conversion_value − (unsubscribe + complaint + deliverability_decay penalties)
```

`email_metrics` supplies the raw signals. Complaints and unsubscribes must be weighted heavily.

---

## Not in Plane 4

| Plane | Examples |
|-------|----------|
| 3 Pre-send deliverability | SPF/DKIM, warmup status, spam-word score — tunable, derive at send time |
| 5 Experimentation | variant ID, bandit arm |
| 6 Guardrails | frequency caps, suppression |
