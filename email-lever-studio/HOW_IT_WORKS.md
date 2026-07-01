# How Email Lever Studio Works

CLI + API reference for cold-outreach email generation.

**Source of truth:** `shared/schema.ts`, `server/prompts.ts`, `server/levers.ts`, `server/routes/`, `scripts/`

---

## What this is

A **CLI-first** cold-outreach drafting tool. You provide four inputs (company, product, campaign, intent); the API suggests levers via Claude, then writes a draft. No browser UI, no database, no auth.

```
CLI inputs → POST /api/suggest-levers → override intent → POST /api/generate-draft → stdout + output/draft-*.txt
```

---

## CLI flow (`scripts/generate-email.ts`)

| Input | Flag | Maps to |
|-------|------|---------|
| Company Name | `--company` | `context.companyName` |
| Product Description | `--product` | embedded in `context.notes` |
| Campaign | `--campaign` | prepended in `context.notes` as `Campaign: …` |
| Intent | `--intent` | `levers.intent.value` (set **after** suggest-levers) |
| Writing style | `--style` | optional block appended to generate-draft system prompt |

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
2. `POST /api/suggest-levers` with `cloneLeverSuggestion()` (clean defaults, no pre-set intent).
3. Override `levers.intent` with CLI `--intent`.
4. `POST /api/generate-draft` with optional `style` from `scripts/writing-styles.ts`.

---

## API

| Endpoint | Input | Output |
|----------|-------|--------|
| `GET /api/health` | — | `{ ok: true }` |
| `POST /api/suggest-levers` | `{ context, levers? }` | `LeverSuggestion` |
| `POST /api/generate-draft` | `{ context, levers, style? }` | `EmailDraft` |

Server: `http://127.0.0.1:3001`. Env: `CLAUDE_API_KEY` (optional `CLAUDE_MODEL`).

### Suggest-levers

1. Validate context (`validateColdContext`).
2. Claude tool-use call with `SUGGEST_LEVERS_SYSTEM_PROMPT` + `formatContextForPrompt(context)`.
3. `normalizeLeverSuggestion()` + `mergeWithLocked()` if existing levers passed.

### Generate-draft

User prompt blocks: context, lever settings, social proof instructions.

System prompt: `GENERATE_DRAFT_SYSTEM_PROMPT` + optional `style` string.

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

CLI provides no social proof assets — AI defaults to `none` unless product notes imply proof.

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

Passed as `style` in generate-draft request body; appended to system prompt.

---

## File map

| File | Role |
|------|------|
| `shared/schema.ts` | Types, defaults, JSON schemas |
| `server/anthropic.ts` | Claude client (`completeStructuredJson`) |
| `server/prompts.ts` | System prompts |
| `server/levers.ts` | Prompt formatting, validation |
| `server/routes/suggest-levers.ts` | Lever recommendation |
| `server/routes/generate-draft.ts` | Draft writing (+ optional style) |
| `scripts/generate-email.ts` | CLI entrypoint |
| `scripts/writing-styles.ts` | Style prompt blocks |
