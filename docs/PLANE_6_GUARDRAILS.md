# Plane 6 — Guardrails

**Role:** Hard constraints — **never learned from**, never optimized. Cadence and compliance rules live here.

**Status:** **Not started** — no schema. Will likely be config/rules engine, not per-email training rows.

---

## Frequency

| Rule | Status |
|------|--------|
| max emails per contact per day / week | ❌ |
| cooldown after N non-engagements | ❌ |
| auto-pause on objection (negative reply) | ❌ |

---

## Cancellation

| Rule | Status |
|------|--------|
| over X sends/day → cancel remaining | ❌ |
| after X sent → Y% cancel rate threshold | ❌ |
| over Y complaints → pause X days | ❌ |

---

## Compliance

| Rule | Status |
|------|--------|
| CAN-SPAM / GDPR / CASL | ❌ |
| consent record on file | ❌ |
| suppression list honored | ❌ |
| unsubscribe honored immediately | ❌ |

---

## How guardrails interact with other planes

```
Send request
  → Plane 6 check (block / allow / throttle)
  → Plane 2 context assembled
  → Plane 1 + 3 features chosen
  → Plane 5 variant selected (if experiment)
  → send
  → Plane 4 metrics recorded
```

Guardrails **block or modify** sends. They do not produce labels for the learning model.

---

## Planned shape (TBD)

Likely **not** a per-email table:

| Approach | Use |
|----------|-----|
| `guardrail_config` per brand | Limits and compliance settings |
| `suppression_list` | Emails/domains that must never receive |
| `consent_record` | Per-contact consent audit trail |

Per-send log optional for audit: `guardrail_event` (blocked, throttled, reason).

---

## Not in Plane 6

| Plane | Why |
|-------|-----|
| 1 Features | Optimized levers |
| 4 Outcomes | Training signals |
| 5 Experimentation | Tests within guardrails |

Unsubscribes and complaints are **Plane 4 outcomes** that inform guardrail triggers — but the rules themselves are not learned.
