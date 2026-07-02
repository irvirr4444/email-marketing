# How Email Lever Studio Works

Technical reference: levers, API, social proof pipeline.

**Start here for setup and commands:** [README.md](README.md)

**Source of truth (code):** `shared/schema.ts`, `shared/lever-definitions.ts`, `server/prompts.ts`, `server/levers.ts`, `server/routes/`, `scripts/`

Human-readable lever spec: repo-root [`levers_scenarios.MD`](../levers_scenarios.MD)

---

## What this is

A **CLI-first** cold-outreach drafting tool. You provide four inputs (company, product, campaign, intent); optionally research social proof assets; the API suggests levers via Claude, then writes a draft. No browser UI, no database, no auth.

```
CLI inputs → [optional] POST /api/research-social-proof → POST /api/suggest-levers → override intent → POST /api/generate-draft → stdout + output/draft-*.txt
```

---

## Two-stage social proof pipeline

Social proof is split into **research** (discover proof) and **use** (weave proof into the email).

| Stage | Endpoint | Question it answers |
|-------|----------|---------------------|
| Research | `POST /api/research-social-proof` | What proof exists for this product? |
| Suggest levers | `POST /api/suggest-levers` | How should the email use that proof? |
| Generate draft | `POST /api/generate-draft` | Write the email with proof woven in |

**Research config** (`SocialProofResearchConfig`):

| Field | Options | Default (CLI) |
|-------|---------|---------------|
| `layers` | ingredient, origin, industry, behavioral, expert, direct, company | ingredient, industry, behavioral |
| `tone` | clinical, mass_market, luxury, casual | clinical |
| `depth` | quick, full, fused | quick |

**Research output** maps into `SocialProofAssets`:

| Field | Used by lever type |
|-------|-------------------|
| `recognizableCustomer` | name_drop, peer |
| `specificResult` | result |
| `customerQuote` | quote |
| `customerCount` | volume |
| `recentWin` | recency |

CLI flags:

```bash
# Research flow (mines proof from product description)
npm run generate -- \
  --company "Acme" --product "..." --campaign "..." --intent get_reply \
  --research \
  --research-layers ingredient,expert \
  --research-tone clinical \
  --research-depth quick

# Direct assets (skip research)
npm run generate -- \
  --company "Acme" --product "..." --campaign "..." --intent get_reply \
  --social-proof-result "Cut month-end close by 60%" \
  --social-proof-customer "Stripe, Notion"
```

Batch mode runs research **once** at the start and reuses assets across all scenarios. Research config and assets are saved in `manifest.json`.

---

## CLI flow (`scripts/generate-email.ts`)

| Input | Flag | Maps to |
|-------|------|---------|
| Company Name | `--company` | `context.companyName` |
| Product Description | `--product` | embedded in `context.notes` |
| Campaign | `--campaign` | prepended in `context.notes` as `Campaign: …` |
| Intent | `--intent` | `levers.intent.value` (set **after** suggest-levers) |
| Writing style | `--style` | optional block appended to generate-draft system prompt |
| Social proof research | `--research` | runs `/api/research-social-proof` before suggest-levers |
| Research layers | `--research-layers` | comma-separated: ingredient, origin, industry, behavioral, expert, direct, company |
| Research tone | `--research-tone` | clinical, mass_market, luxury, casual |
| Research depth | `--research-depth` | quick, full, fused |
| Direct proof assets | `--social-proof-result`, `--social-proof-customer`, `--social-proof-quote`, `--social-proof-count`, `--social-proof-win` | merged into `context.socialProofAssets` |

**Hardcoded context fallbacks:**

| Field | Value |
|-------|-------|
| `recipientName` | `"there"` |
| `recipientEmail` | `"prospect@example.com"` |
| `segmentAtSend` | `"cold_prospect"` |
| `sequenceNumber` | `1` |
| `notes` | `Campaign: {campaign}\n\n{product}` |

**Steps:**

1. Health check `GET /api/health` — fails with `Server not running — start with npm run dev first.`
2. **Optional:** `POST /api/research-social-proof` when `--research` is set — populates `context.socialProofAssets`.
3. Merge any `--social-proof-*` CLI flags into assets (CLI overrides research).
4. `POST /api/suggest-levers` with `cloneLeverSuggestion()` (clean defaults, no pre-set intent).
5. Override `levers.intent` with CLI `--intent`.
6. `POST /api/generate-draft` with optional `style` from `scripts/writing-styles.ts`.

---

## API

| Endpoint | Input | Output |
|----------|-------|--------|
| `GET /api/health` | — | `{ ok: true }` |
| `POST /api/research-social-proof` | `{ productDescription, config }` | `SocialProofAssets` |
| `POST /api/suggest-levers` | `{ context, levers? }` | `LeverSuggestion` |
| `POST /api/generate-draft` | `{ context, levers, style? }` | `EmailDraft` |

Server: `http://127.0.0.1:3001`. Env: `CLAUDE_API_KEY` (optional `CLAUDE_MODEL`).

### Research social proof

1. Validate `productDescription` and `config` (`normalizeResearchConfig`).
2. Claude tool-use call with `RESEARCH_SOCIAL_PROOF_SYSTEM_PROMPT` + scoped layer/tone/depth user prompt.
3. `normalizeSocialProofAssets()` — empty strings stripped.

### Suggest-levers

1. Validate context (`validateColdContext`).
2. Claude tool-use call with `SUGGEST_LEVERS_SYSTEM_PROMPT` + `formatContextForPrompt(context)`.
3. `normalizeLeverSuggestion()` + `mergeWithLocked()` if existing levers passed.

### Generate-draft

User prompt blocks:

1. **Context** — `formatContextForPrompt(context)`
2. **Lever Instructions** — `buildLeverInstructions(levers, context)` from `shared/lever-definitions.ts`

Only definitions for the **selected** lever values are injected (~400–600 tokens), not the full library.

System prompt: `GENERATE_DRAFT_SYSTEM_PROMPT` + optional `style` string (CLI `--style`).

Output: `{ subject, preheader?, body }` — empty preheader stripped.

---

## All levers (`LeverSuggestion`)

AI sets all levers on suggest. CLI only overrides `intent`.

### Intent

| Value | Label |
|-------|-------|
| `book_meeting` | Book Meeting |
| `drive_purchase` | Drive Purchase |
| `get_reply` | Get Reply (AI default) |
| `click_to_page` | Click to Page |
| `collect_info` | Collect Info |
| `referral` | Referral |

### Subject Line (`subjectLine`)

| Field | Options | Default |
|-------|---------|---------|
| `length` | short, medium, long | short |
| `type` | question, statement, curiosity_gap, list, announcement | question |
| `urgency`, `numberIncluded`, `emoji` | boolean | false |
| `casing` | sentence, title, lowercase | sentence |
| `personalizationToken` | boolean (schema only) | false |

### Preheader (`preheader`)

| Field | Options | Default |
|-------|---------|---------|
| `present` | boolean | false |
| `length` | short, medium | short |
| `relationship` | complements, repeats | complements |

### Sender (`sender`)

| Field | Options | Default |
|-------|---------|---------|
| `nameType` | personal, company, hybrid | personal |
| `replyToSet` | boolean | true |

### Body (`body`)

| Field | Options | Default |
|-------|---------|---------|
| `length` | short (&lt;75w), medium, long (200w+) | short |
| `format` | plain, html | plain |
| `linkCount` | zero, one, two_plus | zero |
| `readingLevel` | simple, moderate, advanced | simple |
| `scannable` | boolean | false |

### Copy Strategy (`copyStrategy`)

| Field | Options | Default |
|-------|---------|---------|
| `framework` | AIDA, PAS, BAB, FAB, none | PAS |
| `persuasion` | reciprocity, authority, scarcity, liking, commitment, none | none |
| `emotion` | fear, aspiration, curiosity, humor, fomo, status, pain_relief | curiosity |
| `specificity` | hard_numbers, vague | vague |
| `personalizationDepth` | generic, merge_field, segment_tailored, one_to_one_researched | merge_field |

### Social Proof (`socialProof`)

| Field | Options | Default |
|-------|---------|---------|
| `type` | none, volume, name_drop, peer, result, quote, recency, consensus | none |
| `placement` | opener, body, pre_cta, ps | body |
| `specificity` | vague, specific | vague |

CLI provides no social proof assets by default — AI defaults to `none` unless assets are researched (`--research`) or passed directly (`--social-proof-*`).

### CTA (`cta`)

| Field | Options | Default |
|-------|---------|---------|
| `count` | one, two | one |
| `type` | reply, book, buy, read, download | reply |
| `placement` | inline, end, both | end |
| `style` | button, link, plain_reply_ask | plain_reply_ask |
| `ctaCopy` | string | `"Would you be open to a quick reply?"` |

### Offer (`offer`)

| Field | Options | Default |
|-------|---------|---------|
| `hasOffer` | boolean | false |
| `type` | percent_off, dollar_off, free_trial, bonus, bundle, guarantee | free_trial |
| `magnitude` | string | `""` |
| `scarcity` | none, time_limited, quantity_limited | none |

---

## Writing styles (`scripts/writing-styles.ts`)

| Key | Author |
|-----|--------|
| `kennedy` | Dan Kennedy (direct response) |
| `ogilvy` | David Ogilvy (research-driven) |
| `kern` | Frank Kern (conversational) |
| `chaperon` | Andre Chaperon (story-driven) |
| `halbert` | Gary Halbert (street-smart direct mail) |
| `schwartz` | Eugene Schwartz (market awareness) |
| `albuquerque` | Evaldo Albuquerque (big domino / one belief) |
| `makepeace` | Clayton Makepeace (dominant emotion) |
| `brunson` | Russell Brunson (story-funnel) |
| `bencivenga` | Gary Bencivenga (fascination-driven proof) |
| `carlton` | John Carlton (punchy street copy) |
| `settle` | Ben Settle (daily infotainment) |

Passed as `style` in generate-draft request body; appended to system prompt.

---

## File map

| File | Role |
|------|------|
| `shared/schema.ts` | Types, defaults, JSON schemas |
| `shared/lever-definitions.ts` | Writing-instruction library + `buildLeverInstructions()` |
| `server/anthropic.ts` | Claude client (`completeStructuredJson`) |
| `server/prompts.ts` | System prompts |
| `server/levers.ts` | Prompt formatting, validation |
| `server/routes/research-social-proof.ts` | Social proof research |
| `server/routes/suggest-levers.ts` | Lever recommendation |
| `server/routes/generate-draft.ts` | Draft writing (+ optional style) |
| `scripts/generate-email.ts` | Single-email CLI |
| `scripts/batch-generate.ts` | Batch scenarios + optional `.docx` |
| `scripts/export-docx.ts` | Word export (paragraph spacing) |
| `scripts/scenarios.ts` | Curated, matrix, diverse50 scenarios |
| `scripts/lib.ts` | Shared CLI helpers |
| `scripts/writing-styles.ts` | Style prompt blocks |
