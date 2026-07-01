# Email Marketing

Monorepo for cold-email research, generation, and competitive email storage.

## Projects

| Directory | What it does |
|-----------|----------------|
| [`email-lever-studio/`](email-lever-studio/) | **API + browser UI** — generate cold emails with configurable levers (framework, emotion, social proof, CTA, author style) via Claude, and drive the contextual bandit from a browser. |
| [`bandit_mvp/`](bandit_mvp/) | **Contextual bandit** — Vowpal Wabbit `cb_explore_adf` picks lever *recipes* on the real lever taxonomy; Claude renders them; feedback trains the policy. Reward is synthetic now with a one-function DB swap point. |
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

## Quick start (self-learning bandit + browser UI)

The bandit picks lever recipes, Claude renders them, and your feedback trains the policy.

```bash
# 0. install the bandit deps into the repo venv
.venv/bin/pip install -r bandit_mvp/requirements.txt

# 1. bandit service (terminal 1)
cd email-lever-studio && npm run bandit      # -> http://127.0.0.1:8000

# 2. studio API + browser UI (terminal 2, needs CLAUDE_API_KEY)
cd email-lever-studio && npm run dev         # -> open http://127.0.0.1:3001
```

Headless verification (no API key needed):

```bash
cd bandit_mvp
../.venv/bin/python run.py --mode planted --rounds 20000   # recovery check proves it learns
../.venv/bin/python run.py --mode random  --rounds 12000   # stays flat ~0.5 (correct)
```

Real outcomes swap in via `bandit_mvp/reward.py` (`real_reward`) and `bandit_mvp/db.py`
(`DATABASE_URL`), reading the labelled emails + metrics from `db/schema.sql`. See
[`bandit_mvp/README.md`](bandit_mvp/README.md).

## Database

PostgreSQL. Apply migrations:

```bash
psql "$DATABASE_URL" -f db/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f db/migrations/002_add_context.sql
```

Or bootstrap from `db/schema.sql`. See [`db/README.md`](db/README.md).

## Architecture overview

See [`docs/PLANE_GUIDE.md`](docs/PLANE_GUIDE.md) for the six-plane model (features, context, deliverability, outcomes, experimentation, guardrails).
