# Email Lever Studio

API + CLI + browser UI for **cold-outreach email generation**. You provide company, product, campaign, and intent; Claude suggests levers and writes the draft. Optional social proof research runs first. A contextual bandit ([`../bandit_mvp/`](../bandit_mvp/)) can pick the levers and learn from your feedback.

No auth. Database optional (only for real bandit outcomes).

## Setup

```bash
# API key — repo root .env or email-lever-studio/.env
CLAUDE_API_KEY=sk-ant-...
# optional: CLAUDE_MODEL=claude-sonnet-5
```

```bash
cd email-lever-studio
npm install
npm run dev    # API + browser UI at http://127.0.0.1:3001
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Express API + browser UI (required for all CLIs) |
| `npm run bandit` | Start the Python contextual bandit service (http://127.0.0.1:8000) |
| `npm run generate` | One email — interactive or flags |
| `npm run batch` | Many emails — curated, matrix, or 50 diverse lever combos |
| `npm run lint` | Oxlint |

## Browser UI (self-learning bandit)

Open `http://127.0.0.1:3001` after starting both the bandit service and the API:

```bash
npm run bandit   # terminal 1 — bandit service on :8000
npm run dev      # terminal 2 — API + UI on :3001
```

Flow: enter context -> **Pick levers** (the bandit chooses a recipe on the real lever
taxonomy and returns its propensity) -> **Render this email** (existing `/api/generate-draft`)
-> thumbs up/down or outcome events feed `/api/bandit/learn`, which trains the policy. See
[`../bandit_mvp/README.md`](../bandit_mvp/README.md) for the reward/DB swap point.

Node routes: `POST /api/bandit/pick`, `POST /api/bandit/learn`, `GET /api/bandit/recovery`
proxy to the Python service (`BANDIT_URL`, default `http://127.0.0.1:8000`).

## Generate one email

```bash
npm run generate -- \
  --company "Provence Beauty" \
  --product "Dew Beaucoup Peptide Plumping Serum — copper peptides, hyaluronic acid, $22.99" \
  --campaign "Cold D2C first-touch" \
  --intent drive_purchase \
  --style ogilvy
```

**Required:** `--company`, `--product`, `--campaign`, `--intent`

**Optional:**

| Flag | Purpose |
|------|---------|
| `--style` | `kennedy`, `ogilvy`, `kern`, `chaperon` |
| `--no-file` | Skip writing `output/draft-*.txt` |
| `--research` | Mine social proof from product description |
| `--research-layers` | `ingredient,origin,industry,behavioral,expert,direct,company` |
| `--research-tone` | `clinical`, `mass_market`, `luxury`, `casual` |
| `--research-depth` | `quick`, `full`, `fused` |
| `--social-proof-result` etc. | Pass proof assets directly (see below) |

### Social proof

Two-stage pipeline:

1. **Research** (optional) — `POST /api/research-social-proof` fills `SocialProofAssets`
2. **Generate** — levers pick how proof is used (`type`, `placement`, `specificity`)

```bash
# Research + generate
npm run generate -- \
  --company "Acme" --product "..." --campaign "..." --intent get_reply \
  --research --research-layers ingredient,expert --research-tone clinical

# Or pass assets directly
npm run generate -- \
  --company "Acme" --product "..." --campaign "..." --intent get_reply \
  --social-proof-result "60% faster close" \
  --social-proof-customer "Stripe, Notion"
```

## Batch generate

Runs scenarios through `generate-draft` (levers set per scenario; no `suggest-levers`). Output: `output/batch-{timestamp}/`.

```bash
# 12 curated scenarios (framework × emotion × author style)
npm run batch -- --company "Acme" --product "..." --campaign "Q3"

# 50 diverse lever combinations + Word export
npm run batch -- \
  --company "Provence Beauty" \
  --product "Dew Beaucoup Peptide Serum..." \
  --campaign "Cold D2C" \
  --diverse50 --docx --research

# Framework × emotion × style grid (80 combos)
npm run batch -- --company "Acme" --product "..." --campaign "Q3" --matrix --limit 20

# List scenarios without generating
npm run batch -- --list --diverse50

# Rebuild .docx after editing txt files (paragraph spacing preserved)
npm run batch -- --reexport-docx output/batch-2026-01-01T12-00-00-000Z
```

**Scenario sets:**

| Flag | Count | Coverage |
|------|-------|----------|
| (default) | 12 | Curated cold-outreach pairings |
| `--matrix` | 80 | Framework × emotion × style |
| `--diverse50` | 50 | Broad lever coverage (subject, CTA, social proof, body length, etc.) |

**Batch output:**

- `manifest.json` — metadata, levers, social proof assets
- `NNN-scenario-id.txt` — one file per email
- `cold_emails.docx` — when `--docx` (lever table + subject + body per email)

## Pipeline (single generate)

```
CLI inputs
  → [optional] POST /api/research-social-proof
  → POST /api/suggest-levers
  → CLI overrides intent
  → POST /api/generate-draft
  → stdout + output/draft-*.txt
```

## Project layout

| Path | Role |
|------|------|
| [`shared/`](shared/) | Types, defaults, lever writing definitions |
| [`server/`](server/) | Express API + Claude client |
| [`scripts/`](scripts/) | CLI entrypoints |
| [`output/`](output/) | Generated drafts (gitignored) |

## Documentation

- **[HOW_IT_WORKS.md](HOW_IT_WORKS.md)** — full lever reference, API details, social proof pipeline
- **[scripts/README.md](scripts/README.md)** — what each CLI script does
- Repo root [`levers_scenarios.MD`](../levers_scenarios.MD) — human-readable lever spec
