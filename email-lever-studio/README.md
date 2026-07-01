# Email Lever Studio — CLI

Cold-outreach email generator powered by Plane 1 (feature levers) and Plane 2 (context). No database, no auth, no browser UI — API server + CLI only.

## Setup

Add to the repo root `.env` (or `email-lever-studio/.env`):

```
CLAUDE_API_KEY=sk-ant-...
# optional: CLAUDE_MODEL=claude-sonnet-5
```

```bash
cd email-lever-studio
npm install
npm run dev
```

API runs at `http://127.0.0.1:3001`.

## Generate an email

In a second terminal:

```bash
# Interactive prompts
npm run generate

# Inline args
npm run generate -- \
  --company "Acme Corp" \
  --product "A B2B SaaS tool that automates invoice reconciliation for finance teams" \
  --campaign "Q3 outbound" \
  --intent get_reply \
  --style kern
```

**Required flags:** `--company`, `--product`, `--campaign`, `--intent`

**Optional:** `--style` (`kennedy`, `ogilvy`, `kern`, `chaperon`), `--no-file` (skip writing `output/draft-*.txt`)

## Flow

1. CLI builds minimal `ColdContext` (company, campaign + product in notes, cold-prospect defaults).
2. `POST /api/suggest-levers` — AI picks all style levers from defaults.
3. CLI overrides `intent` with your `--intent` value.
4. `POST /api/generate-draft` — AI writes subject + body (optional writing style appended to system prompt).

## Architecture

| Path | Role |
|------|------|
| `shared/schema.ts` | Types, lever defaults, OpenAI-compatible JSON schemas |
| `server/` | Express API, Claude client, prompts |
| `scripts/generate-email.ts` | CLI entrypoint |
| `scripts/writing-styles.ts` | Kennedy, Ogilvy, Kern, Chaperon style blocks |

See [HOW_IT_WORKS.md](HOW_IT_WORKS.md) for lever reference and API details.
