# Email Lever Studio

CLI + API tool for **cold-outreach email generation**. You provide company, product, campaign, and intent; Claude suggests levers and writes the draft. Optional social proof research runs first.

No browser UI. Optional Postgres import for batch tracking.

## Setup

```bash
# API key — repo root .env or email-lever-studio/.env
CLAUDE_API_KEY=sk-ant-...
# optional: CLAUDE_MODEL=claude-sonnet-5
```

```bash
cd email-lever-studio
npm install
npm run dev    # API at http://127.0.0.1:3001
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Express API (required for all CLIs) |
| `npm run generate` | One email — interactive or flags |
| `npm run batch` | Many emails — curated, matrix, or 50 diverse lever combos |
| `npm run import-batch` | Write `import-postgres.sql` for Supabase from a batch folder |
| `npm run lint` | Oxlint |

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
| `--style` | `kennedy`, `ogilvy`, `kern`, `chaperon`, `halbert`, `schwartz`, `albuquerque`, `makepeace`, `brunson`, `bencivenga`, `carlton`, `settle` |
| `--no-file` | Skip writing `output/draft-*.txt` |
| `--research` | Mine social proof from product description and/or URLs |
| `--company-url` | Company website URL to fetch for social proof research |
| `--product-url` | Product page URL to fetch for social proof research |
| `--research-layers` | `ingredient,origin,industry,behavioral,expert,direct,company` |
| `--research-tone` | `clinical`, `mass_market`, `luxury`, `casual` |
| `--research-depth` | `quick`, `full`, `fused` |
| `--social-proof-result` etc. | Pass proof assets directly (see below) |

### Social proof

Two-stage pipeline:

1. **Research** (optional) — `POST /api/research-social-proof` fills `SocialProofAssets`
2. **Generate** — levers pick how proof is used (`type`, `placement`, `specificity`)

```bash
# Research from URLs + generate
npm run generate -- \
  --company "Provence Beauty" \
  --company-url "https://www.provencebeauty.com/" \
  --product-url "https://www.provencebeauty.com/collections/serums-oils/products/dew-beaucoup-peptide-serum" \
  --product "Dew Beaucoup Peptide Serum" \
  --campaign "Cold D2C" --intent get_reply \
  --research --research-layers ingredient,direct,company --research-depth full

# Research + generate (text only)
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

## Import to Supabase

After generating a batch (`output/<folder>/` with `manifest.json` + `.txt` files):

```bash
# 1. Once: run db/migrations/003_generated_emails.sql in Supabase SQL Editor

# 2. Generate import SQL from the batch folder
npm run import-batch -- output/provence-50-2026-07-01T14-26-07-634Z

# 3. Run output/<folder>/import-postgres.sql in Supabase SQL Editor
```

Writes `import-postgres.sql` with upserts for `generation_batch` + `generated_email`. Safe to re-run.

See [`db/README.md`](../db/README.md).

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
