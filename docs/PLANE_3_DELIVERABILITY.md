# Plane 3 — Deliverability

**Role:** The gate in front of everything. For cold email, often more predictive than copy tags.

**Status:** **Not started** (schema). Pre-send levers have no table yet. Measured placement is stored in Plane 4.

---

## Two kinds of deliverability data

| Kind | Nature | Where |
|------|--------|--------|
| **Pre-send inputs** | Tunable levers (like Plane 1) | Future `email_deliverability` or extend `email_analysis` |
| **Measured results** | Outcomes after send | Plane 4 → `email_metrics` |

---

## Pre-send — infrastructure (not in DB yet)

| Input | Status |
|-------|--------|
| sending domain / IP | ❌ |
| warmup status | ❌ |
| volume vs reputation limits | ❌ |
| SPF / DKIM / DMARC pass | ❌ |

---

## Pre-send — content spam risk (not in DB yet)

| Input | Status |
|-------|--------|
| spam-word score | ❌ |
| link count | ❌ (partially derivable from `email_message.body_*`) |
| image:text ratio | ❌ |
| attachment? | ❌ |
| ALL-CAPS | ❌ |

---

## Measured placement → Plane 4

These are **outcomes**, not levers:

| Input | Table | Status |
|-------|-------|--------|
| delivered | `email_metrics.delivered` | ✅ |
| bounce type (hard / soft) | `email_metrics.bounce_type` | ✅ |
| Primary / Promotions / Spam | `email_metrics.placement` | ✅ |
| spam complaint | `email_metrics.spam_complaint` | ✅ |

---

## Planned shape

One row per send, captured **at send time** (before delivery results are known):

```
email_message
  └── email_deliverability   (future — Plane 3 pre-send snapshot)
```

Join with `email_metrics` for full deliverability story: what we chose vs what happened.

---

## Not in Plane 3

| Plane | Where |
|-------|--------|
| 1 Features | Copy choices |
| 2 Context | Recipient situation |
| 4 Outcomes | Full engagement + conversion |
| 5 Experimentation | Variant assignment |
| 6 Guardrails | Compliance blocks |
