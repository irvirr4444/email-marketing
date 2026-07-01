# Email Marketing

Monorepo for cold-email research, generation, and storage.

## Projects

| Directory | What it does |
|-----------|----------------|
| [`email-lever-studio/`](email-lever-studio/) | **CLI + API** — generate cold emails with configurable levers. Uses Claude. |
| [`cold_email_bandit/`](cold_email_bandit/) | **Python simulator** — bandit learns which lever recipes convert (offline). |
| [`db/`](db/) | **Postgres / Supabase** — store generated email templates + lever tags. |
| [`docs/`](docs/) | Plane architecture (context, features, metrics). |

## Quick start

```bash
echo 'CLAUDE_API_KEY=sk-ant-...' >> .env

cd email-lever-studio
npm install
npm run dev          # terminal 1
npm run generate     # terminal 2
```

See [`email-lever-studio/README.md`](email-lever-studio/README.md) for batch runs, Word export, and Supabase import.

## Store generated emails in Supabase

1. Run [`db/migrations/003_generated_emails.sql`](db/migrations/003_generated_emails.sql) in Supabase SQL Editor (once).
2. Generate a batch: `npm run batch -- --company "..." --product "..." --campaign "..." --diverse50`
3. Build import SQL: `npm run import-batch -- output/<batch-folder>`
4. Run `output/<batch-folder>/import-postgres.sql` in Supabase SQL Editor.

## Spec files (repo root)

- [`levers_scenarios.MD`](levers_scenarios.MD) — lever definitions in prose
- [`social_proof_levers.md`](social_proof_levers.md) — social proof system
- [`social_proof_prompt_preview.md`](social_proof_prompt_preview.md) — prompt templates

Runtime lever code: `email-lever-studio/shared/lever-definitions.ts`.
