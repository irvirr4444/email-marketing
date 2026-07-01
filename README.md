# Email Marketing

Monorepo for cold-email research, generation, and competitive email storage.

## Projects

| Directory | What it does |
|-----------|----------------|
| [`email-lever-studio/`](email-lever-studio/) | **CLI + API** — generate cold emails with configurable levers (framework, emotion, social proof, CTA, author style). Uses Claude. Start here for drafting. |
| [`cold_email_bandit/`](cold_email_bandit/) | **Python simulator** — contextual bandit learns which lever *recipes* convert in a synthetic cold-outreach environment. Headless, offline, no API keys required. |
| [`db/`](db/) | **PostgreSQL schema** — store raw emails, context snapshots, AI feature tags, and outcome metrics. |
| [`docs/`](docs/) | **Plane architecture** — how context, features, deliverability, metrics, experimentation, and guardrails fit together. |

## Spec files (repo root)

Human-written lever and social-proof specs (not runtime code):

- [`levers_scenarios.MD`](levers_scenarios.MD) — what each lever value means in writing terms
- [`social_proof_levers.md`](social_proof_levers.md) — social proof variable system (layers, format, tone, depth)
- [`social_proof_prompt_preview.md`](social_proof_prompt_preview.md) — researcher/copywriter prompt templates

Runtime lever definitions live in `email-lever-studio/shared/lever-definitions.ts`.

## Quick start (email generation)

```bash
# 1. API key at repo root
echo 'CLAUDE_API_KEY=sk-ant-...' >> .env

# 2. Start API + generate one email
cd email-lever-studio
npm install
npm run dev          # terminal 1 — http://127.0.0.1:3001
npm run generate     # terminal 2 — interactive prompts
```

See [`email-lever-studio/README.md`](email-lever-studio/README.md) for batch runs, social proof research, and `.docx` export.

## Database

PostgreSQL. Apply migrations:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_add_context.sql
```

Or bootstrap from `db/schema.sql`. See [`db/README.md`](db/README.md).

## Architecture overview

See [`docs/PLANE_GUIDE.md`](docs/PLANE_GUIDE.md) for the six-plane model (features, context, deliverability, outcomes, experimentation, guardrails).
