# Email Marketing

Monorepo for cold-email research, generation, and storage.

## Projects

| Directory | What it does |
|-----------|----------------|
| [`email-lever-studio/`](email-lever-studio/) | **API + React UI + CLI** — generate cold emails with configurable levers (framework, emotion, social proof, CTA, author style) via Claude. The UI uses the contextual bandit to pick the levers, with Claude suggest-levers as fallback. |
| [`bandit_mvp/`](bandit_mvp/) | **Contextual bandit** — Vowpal Wabbit `cb_explore_adf` picks lever *recipes* on the real lever taxonomy; Claude renders them; logged outcomes train the policy. Reward is synthetic now with a one-function DB swap point. |
| [`db/`](db/) | **Postgres / Supabase** — store raw emails, generated templates + lever tags, context snapshots, and outcome metrics. |
| [`docs/`](docs/) | **Plane architecture** — how context, features, deliverability, metrics, experimentation, and guardrails fit together. |

## Spec files (repo root)

- [`levers_scenarios.MD`](levers_scenarios.MD) — what each lever value means in writing terms
- [`social_proof_levers.md`](social_proof_levers.md) — social proof variable system (layers, format, tone, depth)
- [`social_proof_prompt_preview.md`](social_proof_prompt_preview.md) — researcher/copywriter prompt templates

Runtime lever definitions live in `email-lever-studio/shared/lever-definitions.ts`.

## Quick start (bandit-driven React UI)

The bandit picks lever recipes, Claude renders them into copy.

```bash
# 0. API key at repo root
echo 'CLAUDE_API_KEY=sk-ant-...' >> .env

# 1. install the bandit deps into the repo venv
.venv/bin/pip install -r bandit_mvp/requirements.txt

cd email-lever-studio
npm install

npm run bandit     # terminal 1 — bandit service on http://127.0.0.1:8000
npm run dev        # terminal 2 — Express API on http://127.0.0.1:3001
npm run dev:ui     # terminal 3 — React UI on http://127.0.0.1:5173
```

If the bandit service is down, the UI transparently falls back to Claude's
`/api/suggest-levers` for lever selection.

## Quick start (CLI email generation)

```bash
cd email-lever-studio
npm run dev          # terminal 1 — http://127.0.0.1:3001
npm run generate     # terminal 2 — interactive prompts
```

See [`email-lever-studio/README.md`](email-lever-studio/README.md) for batch runs, social proof research, `.docx` export, and Supabase import.

## Headless bandit verification (no API key needed)

```bash
cd bandit_mvp
../.venv/bin/python run.py --mode planted --rounds 20000   # recovery check proves it learns
../.venv/bin/python run.py --mode random  --rounds 12000   # stays flat ~0.5 (correct)
```

Real outcomes swap in via `bandit_mvp/reward.py` (`real_reward`) and `bandit_mvp/db.py`
(`DATABASE_URL`), reading the labelled emails + metrics from `db/schema.sql`. See
[`bandit_mvp/README.md`](bandit_mvp/README.md).

## Store generated emails in Supabase

1. Run [`db/migrations/003_generated_emails.sql`](db/migrations/003_generated_emails.sql) in Supabase SQL Editor (once).
2. Generate a batch: `npm run batch -- --company "..." --product "..." --campaign "..." --diverse50`
3. Build import SQL: `npm run import-batch -- output/<batch-folder>`
4. Run `output/<batch-folder>/import-postgres.sql` in Supabase SQL Editor.

## Database

PostgreSQL. Apply migrations:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_add_context.sql
psql "$DATABASE_URL" -f db/migrations/003_generated_emails.sql
```

Or bootstrap from `db/schema.sql`. See [`db/README.md`](db/README.md).

## Architecture overview

See [`docs/PLANE_GUIDE.md`](docs/PLANE_GUIDE.md) for the six-plane model (features, context, deliverability, outcomes, experimentation, guardrails).
