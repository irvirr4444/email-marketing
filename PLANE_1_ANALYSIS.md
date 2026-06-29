# Plane 1 — Analysis (features / levers)

Tags describing **what the email chose to do** — subject style, framework, CTA, offer, sequence position, etc. One row per `email_message`, **past and present**.

Historical imports get tagged the same as live sends — rules, ESP metadata, or AI on subject/body. When `email_metrics` arrive later, tags can be backfilled (e.g. sequence position, previous outcome).

| Plane | Role | Table |
|-------|------|-------|
| **1 Features** | Levers the AI optimizes | **`email_analysis`** |
| 2 Context | Input at send | `email_context` |
| 4 Outcomes | What happened after | `email_metrics` |

---

## email_analysis

FK: `message_id` → `email_message(id)` — 1:1.

Most columns are partial today; expand as Plane 1 spec grows (see [PHASES_GUIDE.md](PHASES_GUIDE.md)).

| Input | Type | Notes |
|-------|------|-------|
| `extras` | jsonb | Overflow / provider-specific feature fields |
| `updated_at` | timestamptz | Changes on backfill or re-tag |

---

## Past emails

Every imported email should get an `email_analysis` row — same as `email_context` and `email_metrics`.

```
import email_message
  → email_context
  → email_metrics     (if ESP provided stats; else nulls)
  → email_analysis    (tag from rules or AI on body/subject)
```

---

## Backfill with metrics

`email_metrics` does not live in `email_analysis`, but it **informs** re-tagging:

| Metric signal | Can improve Plane 1 tags |
|---------------|--------------------------|
| Opened but no reply | sequence previous outcome → opened-no-reply |
| Chronological replay | sequence position (email 1, 2, 3…) |
| `goal_completed` + intent | validate intent label |
| Negative reply | sentiment-linked copy tags |

After backfill, replay `email_context.prior_*` from `email_metrics` chronologically per contact.

---

## Entity relationships

```
email_message
  ├── email_context
  ├── email_metrics
  └── email_analysis
```

---

## Not in Plane 1

| Plane | Examples |
|-------|----------|
| 2 Context | segment, geo, engagement history before send |
| 3 Deliverability (pre-send) | spam score, SPF — tunable levers, separate table later |
| 4 Outcomes | opened, clicked — `email_metrics` |
| 5 Experimentation | variant ID, bandit arm |
| 6 Guardrails | frequency caps |
