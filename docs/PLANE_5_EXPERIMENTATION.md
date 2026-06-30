# Plane 5 — Experimentation

**Role:** Keeps learning causal, not biased. Without randomization, the system reinforces what it already believes and optimizes into a local max.

**Status:** **Not started** — no schema, no docs beyond this spec.

---

## Required tags

| Input | Description | Status |
|-------|-------------|--------|
| variant ID | Which creative / arm was sent | ❌ |
| test type | A/B · multivariate · bandit · holdout | ❌ |
| bandit arm | Arm identifier when using bandits | ❌ |
| explore vs exploit | Whether this send was exploration | ❌ |
| control / holdout membership | Excluded from training? | ❌ |
| hypothesis tag | What we're testing | ❌ |

---

## Design decision (open)

Does the AI:

1. **Score drafts** — rank variants before send
2. **Select among variants** — bandit over live arms (usual winner, needs traffic)
3. **Fine-tune on winners** — post-hoc model update

Bandit-over-variants is the default recommendation when volume exists.

---

## Planned shape

```
email_message
  └── email_experiment   (future — 1:1 when send is part of a test)
```

Optional parent:

```
experiment
  └── email_experiment (many)
```

---

## Rules

- Plane 5 tags describe **how** the message was chosen for learning — not copy (Plane 1) or recipient context (Plane 2).
- Holdout rows must be excluded from optimization but included in reporting.
- Never conflate experiment assignment with outcomes — assignment is input to causal analysis.

---

## Not in Plane 5

| Plane | Where |
|-------|--------|
| 1 Features | What's in the email |
| 2 Context | Who received it |
| 4 Outcomes | What happened |
| 6 Guardrails | Hard limits (not A/B tests) |
