# Lever — Frontend Reference

This document describes the **current state** of the Email Lever Studio frontend (`email-lever-studio/`). It is written so an AI assistant (or new developer) can understand layout, behavior, data flow, and design conventions without reading every file.

**Version:** v6 — Expressive (hierarchical bento, card tiers, StepRail, expanded palette)  
**Last updated:** reflects v6: tiered spacing, `.card-primary`/`.card-supporting`, asymmetric bento (8/4, 9/3), scroll-spy `StepRail`, draft skeleton hero, multi-role colors.

Design spec: [`../frontend_revamp.md`](../frontend_revamp.md)

---

## What this app is

A **single-session, no-auth** web tool for writing cold outreach emails. The user provides sparse prospect context (Plane 2), adjusts AI-suggested email feature levers (Plane 1), and gets a generated draft.

- **Not built:** user accounts, saved history, database reads/writes, analytics/metrics, multi-thread management.
- **OpenAI** is called only from the Express backend (`/api/*`). The browser never sees the API key.

The app lives in `email-lever-studio/` inside the `email-marketing` monorepo. It mirrors internal schema shapes from `docs/PLANE_1_FEATURES.md` and `docs/PLANE_2_CONTEXT.md` but does **not** connect to PostgreSQL.

---

## How to run

```bash
cd email-lever-studio
npm install
npm run dev
```

- **Frontend (Vite):** http://localhost:8000  
- **Backend (Express):** http://127.0.0.1:3001 — proxied via Vite at `/api/*`  
- **Env:** `OPENAI_API_KEY` in repo root `.env` or `email-lever-studio/.env`

`npm run dev` starts API first (`wait-on` health check), then Vite.

---

## Tech stack (frontend)

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build / dev | Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + CSS custom properties |
| UI kit | Custom Material 3–styled components (no MUI dependency) |
| Icons | Material Symbols Outlined (Google Fonts CDN) |
| Routing | None — single page, no router |
| State | React `useState` in `App.tsx` only (no Redux/Zustand) |
| Fonts | Roboto (UI), Inter 600/700 (display headers), Roboto Mono (meta), Source Serif 4 (draft body) — Google Fonts in `index.html` |

---

## Page layout

### Overall structure (v6 Expressive)

One scrollable page with **fixed StepRail** (desktop) and four major sections:

```
┌────┬────────────────────────────────────────────────────────┐
│ ●  │  Sticky AppBar + [Generate email]                      │
│ │  ├────────────────────────────────────────────────────────┤
│ ●  │  max-w-[880px]: Recipient → Draft (hero) → Intent      │
│ │  ├────────────────────────────────────────────────────────┤
│ ●  │  max-w-7xl: Style bento (asymmetric 8/4, 9/3, 6/6)     │
│ ●  │                                                        │
└────┴────────────────────────────────────────────────────────┘
  StepRail (lg+, fixed left)
```

- **Spacing:** `space-y-12` between major sections; `space-y-3` within sections.
- **Section IDs:** `section-recipient`, `section-draft`, `section-intent`, `section-style` — each has `scroll-margin-top: 80px` for StepRail / AppBar offset.
- **Recipient / Draft / Intent:** `max-w-[880px]`, `px-6`.
- **Style section:** `max-w-7xl`.

### AppBar (`AppBar.tsx`)

- Sticky, 64px, `--surface` background.
- **Elevate on scroll:** `box-shadow` fades in after `scrollY > 0` (`.app-bar.elevated`).
- **Left:** "Lever" (Inter 700, 20px) + subtitle `Cold Outreach · Email 1` (hidden on mobile).
- **Right:** status text (`Suggesting…` / `Drafting…`) + filled pill primary button.
- **Button:** `Generate email` → `Regenerate email` when `draft !== null`.
- Disabled until `recipientName` + `recipientEmail` filled; tooltip: `Add a name and email to generate.`

---

## User flow (current behavior)

### 1. Levers are visible on load

Default levers show immediately (`DEFAULT_LEVER_SUGGESTION` from `shared/schema.ts`). User can pre-set and lock any lever before suggesting or generating.

### 2. Lock levers (optional, anytime)

- **Auto-lock:** editing any control inside a style card or Intent locks that card/intent and triggers a 240ms tonal step-up (`.lock-settle`) on the card background.
- **Manual lock:** Material Symbols `lock` / `lock_open` icon button on each card and Intent row.
- **Locked = fixed:** on suggest-levers, locked values are preserved via `mergeWithLocked()` on the server; AI only fills unlocked cards.

### 3. "Suggest levers" (secondary action)

**Material switch** in the Style section header (`StyleSection.tsx`), labeled `Suggest levers`.

- Flipping on calls `POST /api/suggest-levers` only — **no draft**.
- Switch auto-flips off when the request resolves.
- Requires `recipientName` + `recipientEmail` (disabled while loading or if fields empty).
- Re-triggerable after context edits to refresh unlocked cards without touching an existing draft.
- Sets `leversSuggested = true` on success.

### 4. "Generate email" (primary action)

**Filled button** in sticky `AppBar`. Requires `recipientName` + `recipientEmail`.

| `leversSuggested` | Behavior |
|-------------------|----------|
| `false` | Fast path: suggest-levers → collapse optional context → generate-draft (two API calls) |
| `true` | Draft only: generate-draft with **current** levers — does **not** re-suggest or overwrite manual edits |

When `leversSuggested === true`, the existing draft is **not** cleared before generating (avoids blanking the panel during re-generate).

### 5. "Regenerate email"

Same AppBar button when `draft !== null`. Calls `handleRegenerate` → draft-only (`generate-draft`), uses current levers.

### 6. Edit draft + copy

Draft subject, preheader (if non-empty), and body are inline-editable. **Copy to clipboard** copies all three (preheader omitted if empty).

---

## Section 1 — Recipient (`RecipientSection.tsx`)

Plain section (no card chrome):

- Title: **Who you're writing to**
- Two Material outlined text fields: Recipient name, Recipient email (side-by-side desktop, stack mobile).
- **Segment assist chip** + dropdown menu (12 `CUSTOMER_SEGMENT_OPTIONS` values).
- **`+ Add more about them`** text button expands optional context inline (collapsed by default).

### Optional context (`ContextDetails.tsx`)

Expands beneath Recipient when toggled open. Collapses on generate (`setContextExpanded(false)`).

Subtitle: "Add anything you actually know about them — the rest stays unset."

| Field | Control |
|-------|---------|
| Company, Industry, Role | Outlined text fields |
| Seniority, Company size | `OutlinedMenuField` (Material menu) |
| Country | `CountryField` — autocomplete with flag emoji |
| Language | `LanguageField` — autocomplete with dim ISO code |
| Notes | Multiline textarea |

**Hide** text button collapses the section.

### Data shape (`ColdContext`)

- `segmentAtSend: CustomerSegment` — one of 12 values in `CUSTOMER_SEGMENT_OPTIONS`
- `sequenceNumber: 1` — hardcoded (not editable)
- `country` / `language` — optional strings storing **human-readable names** (e.g. "United States", "English")

---

## Section 2 — Draft (`DraftCard.tsx`) — hero treatment

- **`.card-primary`** + `--surface-paper` (`#FFFEFB`) background, `p-8`, 20px radius.
- Subject: **20px** Roboto 500; body: **17px / 1.7** Source Serif 4.
- **Loading:** skeleton shimmer (3–4 bars), not linear progress.
- **Empty:** large `draft` icon at low opacity + muted copy.
- Fade-through on `draftVersion`; copy button turns `--success` when copied.

---

## Section 3 — Intent (`IntentChips.tsx`)

- Title: **What's the goal of this email?** (`.section-title`)
- Filter chips use `--primary` when selected (only place besides Generate button).
- Locked: `.card-locked` left border (`--tertiary`) + `--surface-container` background.
- AI reasoning: `auto_awesome` icon in `--secondary`.

---

## Section 4 — Style (`StyleSection.tsx`)

- Title: **Style** (`.section-title`) + `Suggest levers` switch.
- Bento panel: 12px grid gap, `p-3 md:p-4`.

### Bento layout (v6)

| Breakpoint | Layout |
|------------|--------|
| `lg+` | Row 1: Subject **8** + Sender/Preheader stack **4**; Row 2: Body **9** + Copy Strategy **3**; Row 3: CTA **6** + Offer **6** |
| `md` | 2 col; Subject full-width; Body span 2, Copy span 1 |
| mobile | Single column |

### Card tiers (`StyleGroupCard`)

| Variant | Cards | Class |
|---------|-------|-------|
| `primary` | Subject Line, Body | `.card-primary` |
| `supporting` | Copy Strategy, CTA, Offer | `.card-supporting` |
| `compact-supporting` | Sender, Preheader | `.card-supporting`, 13px title |

Locked cards: `.card-locked` (3px `--tertiary` left border).

### StyleField

- Choice chips: selected uses `--secondary-container` / `--secondary` (not primary).
- `layout: 'stacked'` for Copy Strategy and CTA — uppercase micro-labels on chip groups.
- Toggle batches render horizontally.

---

## UI primitives

| Component | File | Purpose |
|-----------|------|---------|
| `MaterialIcon` | `MaterialIcon.tsx` | Material Symbols Outlined wrapper (`filled` prop) |
| `MaterialChip` | `MaterialChip.tsx` | Choice, filter, and assist chip variants |
| `MaterialSwitch` | `MaterialSwitch.tsx` | M3 switch track/thumb |
| `LockButton` | `LockButton.tsx` | `lock` / `lock_open` icon button |
| `AutocompleteField` | `AutocompleteField.tsx` | M3 outlined autocomplete + elevated menu (keyboard nav) |
| `CountryField` | `CountryField.tsx` | Wraps autocomplete + `shared/countries.ts` flags |
| `LanguageField` | `LanguageField.tsx` | Wraps autocomplete + `shared/languages.ts` codes |
| `OutlinedMenuField` | `OutlinedMenuField.tsx` | Outlined dropdown for enum fields (seniority, company size) |
| `AppBar` | `AppBar.tsx` | Sticky header, status, primary action |
| `RecipientSection` | `RecipientSection.tsx` | Name/email, segment chip, expand toggle |
| `ContextDetails` | `ContextDetails.tsx` | Optional context grid |
| `DraftCard` | `DraftCard.tsx` | Draft preview, loading, copy |
| `IntentChips` | `IntentChips.tsx` | Intent filter chips + lock |
| `StyleSection` | `StyleSection.tsx` | Bento grid orchestration |
| `StyleGroupCard` | `StyleGroupCard.tsx` | Single lever card shell |
| `StyleField` | `StyleField.tsx` | Field renderer from `CARD_DEFINITIONS` |
| `StepRail` | `StepRail.tsx` | Scroll-spy nav (fixed rail desktop, FAB mobile) |

**Removed in v5/v6 (do not recreate):** `ColdContextPanel`, `LeverPanel`, `DraftPanel`, `CardFields`, `LeverGroupCard`, `IntentLever`, `SegmentedControl`, `ToggleSwitch`, `SearchableSelect`, `SegmentSelect`, `CountrySelect`, `LanguageSelect`, `Badge`, `LockIcon`, `LoadingShimmer`, v4 `console/` scaffolding.

---

## Design system

### Colors (Material 3 light scheme)

| Token | Hex | Usage |
|-------|-----|--------|
| `--surface` | `#FFFFFF` | Page background |
| `--surface-container` | `#F8F9FE` | Section/card backgrounds |
| `--surface-container-high` | `#EEF1FA` | Selected chips, locked cards, hover |
| `--outline` | `#C4C7CE` | Outlined field borders |
| `--outline-variant` | `#E3E5EC` | Hairline dividers |
| `--on-surface` | `#1B1B1F` | Primary text |
| `--on-surface-variant` | `#46474F` | Labels, secondary text |
| `--primary` | `#1A73E8` | Generate/Regenerate button, selected Intent chip only |
| `--primary-container` | `#D3E3FD` | Selected Intent chip fill |
| `--secondary` | `#00696D` | AI `auto_awesome` icons |
| `--secondary-container` | `#B2F1F0` | Selected style choice chips |
| `--tertiary` | `#6B5C9E` | Locked state (border, lock icon) |
| `--tertiary-container` | `#E8DEFF` | (reserved) |
| `--success` | `#1E8E3E` | Copy confirmation |
| `--surface-paper` | `#FFFEFB` | Draft hero background |
| `--on-primary` | `#FFFFFF` | Text on primary surfaces |
| `--error` | `#B3261E` | Error states |

### Card surface tiers

| Class | Use |
|-------|-----|
| `.card-primary` | Subject, Body, Draft — 20px radius, soft shadow |
| `.card-supporting` | Other style cards — 16px radius, `--surface-container` |
| `.card-locked` | 3px left border `--tertiary` when locked |

### Typography

| Role | Size | Face |
|------|------|------|
| Section titles | clamp(28px, 4vw, 32px) | Inter 700 (`.section-title`) |
| Card titles | 13–14px | Roboto 500 |
| Draft subject | 20px | Roboto 500 |
| Draft body | 17px / 1.7 | Source Serif 4 |

### Geometry

- Border radius: 16px section cards, 8px fields/buttons, pill chips and primary button.
- Elevation utilities: `.elevation-1` through `.elevation-3` in `index.css`.
- Spacing: 8px base grid; `space-y-10` between major sections.

### Motion

| Pattern | Class / trigger | Duration |
|---------|-----------------|----------|
| Expand/collapse | `.expand-collapse` | 200ms |
| Fade-through (draft) | `.fade-through-out/in` on `draftVersion` | 150ms each |
| Lock settle | `.lock-settle` on card edit | 240ms |
| AppBar elevate | `.app-bar.elevated` on scroll | 150ms |
| Linear progress | `.linear-progress-indeterminate` | continuous |
| Ripple | `.m-ripple` on buttons/chips | 400ms |

`prefers-reduced-motion`: disables ripples, height animations, step-rail pulse, skeleton shimmer; shortens fade-through to 80ms.

No animation library — CSS only.

---

## State management (`App.tsx`)

All state lives in the root component:

```ts
context: ColdContext
contextExpanded: boolean          // optional context section open/closed
levers: LeverSuggestion           // always populated (defaults on load)
leversSuggested: boolean          // true after any successful suggest-levers
draft: EmailDraft | null
loadingLevers: boolean
loadingDraft: boolean
draftVersion: number
error: string | null
```

**Handlers:**

| Handler | Trigger | API calls |
|---------|---------|-----------|
| `handleSuggestLevers` | Style "Suggest levers" switch | suggest-levers only |
| `handleGenerateEmail` | AppBar "Generate email" | suggest + draft if `!leversSuggested`, else draft only |
| `handleRegenerate` | AppBar "Regenerate email" | generate-draft only |
| `handlePrimaryAction` | AppBar button | routes to generate or regenerate based on `draft` |

---

## API client (`src/api.ts`)

```ts
suggestLevers(context, levers?)  → POST /api/suggest-levers
generateDraft(context, levers)   → POST /api/generate-draft
```

Both use relative `/api/*` paths (Vite proxy in dev). Errors throw with server `error` message.

---

## Types & schema

**Frontend re-exports** from `shared/schema.ts` via `src/types.ts`:

- `ColdContext`, `LeverSuggestion`, `EmailDraft`, `CustomerSegment`, etc.
- `cloneLeverSuggestion()`, `emptyColdContext()`, `DEFAULT_LEVER_SUGGESTION`
- `CARD_DEFINITIONS`, `INTENT_OPTIONS`, `CUSTOMER_SEGMENT_OPTIONS`, `SEGMENT_LABELS`, `labelForSegment()`
- `shared/countries.ts` — `COUNTRIES`, `countryCodeToFlag()`
- `shared/languages.ts` — `LANGUAGES`

**Single source of truth:** `shared/schema.ts` — also used by Express routes. Field definitions, defaults, enum validation, OpenAI JSON schemas, and `mergeWithLocked()` all live there.

**Do not duplicate** lever field lists in frontend-only files.

---

## File map (frontend)

```
email-lever-studio/
├── index.html              # fonts (Roboto, Inter, Source Serif 4, Material Symbols), title
├── vite.config.ts          # port 8000, /api → 127.0.0.1:3001
├── shared/
│   ├── schema.ts           # types, CARD_DEFINITIONS, segments, merge helpers
│   ├── countries.ts        # ISO 3166-1 list + flag helper
│   └── languages.ts        # ISO 639-1 list
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api.ts
    ├── types.ts
    ├── index.css           # M3 tokens, card tiers, bento v6, step-rail, skeleton
    └── components/
        ├── StepRail.tsx
        ├── AppBar.tsx
        ├── RecipientSection.tsx
        ├── ContextDetails.tsx
        ├── DraftCard.tsx
        ├── IntentChips.tsx
        ├── StyleSection.tsx
        ├── StyleGroupCard.tsx
        ├── StyleField.tsx
        ├── MaterialIcon.tsx
        ├── MaterialChip.tsx
        ├── MaterialSwitch.tsx
        ├── LockButton.tsx
        ├── AutocompleteField.tsx
        ├── CountryField.tsx
        ├── LanguageField.tsx
        └── OutlinedMenuField.tsx
```

---

## Lock semantics (important for AI assistants)

- Locks are **client-side UX**; regenerate always sends full current `LeverSuggestion` to the server.
- On **suggest-levers**, server runs `mergeWithLocked(aiSuggestion, existingLevers)` — locked cards/intent keep user values; AI reasoning on locked cards may update.
- On **generate-draft**, all current values (locked or not) drive the written email.
- Regenerate does **not** re-suggest levers — only rewrites the draft.

---

## What is intentionally NOT in the UI

- Auth / login
- Save/load emails
- Database connection (Plane 2 schema is form-only)
- Metrics, scoring, A/B analytics
- Campaign type lever (hardcoded in AppBar subtitle: Cold Outreach · Email 1)
- Sequence position lever (hardcoded in AppBar subtitle)
- Author/methodology style picker (deferred)
- Image support in drafts
- Send timing / daypart levers
- Multi-email thread view

---

## Related docs

- [`README.md`](README.md) — quick start + architecture summary
- [`../frontend_revamp.md`](../frontend_revamp.md) — v5 Sheet design spec
- [`../docs/PLANE_1_FEATURES.md`](../docs/PLANE_1_FEATURES.md) — lever taxonomy source of truth
- [`../docs/PLANE_2_CONTEXT.md`](../docs/PLANE_2_CONTEXT.md) — cold context field semantics
- [`../docs/PLANE_GUIDE.md`](../docs/PLANE_GUIDE.md) — overall plane architecture

---

## Quick checklist for AI making frontend changes

1. **Lever fields** — edit `CARD_DEFINITIONS` in `shared/schema.ts`, not ad-hoc in components.
2. **New control type** — extend `FieldDef` + `StyleField.tsx` + schema generator if needed.
3. **API shape changes** — update `shared/schema.ts`, server routes, and `src/api.ts` together.
4. **Styling** — use M3 CSS variables from `index.css` (`--primary`, `--surface-container`, etc.); keep elevation sparse.
5. **Lock behavior** — any manual lever edit should set `locked: true` on that card/intent.
6. **Never call OpenAI from the browser** — only `/api/*`.
7. **Port** — frontend dev is **8000**, not 5173.
8. **Suggest vs Generate** — use `leversSuggested` gate; never re-suggest on Generate email after first suggest unless user flips Suggest levers switch.
9. **Layout** — maintain single-column scroll model; Style bento in `index.css` (`.style-bento*`); StepRail uses section IDs.
10. **Copy** — sentence case for actions (`Generate email`, not `Generate Email`).
11. **Color roles** — reserve `--primary` for Generate button + Intent chips; style chips use `--secondary`; locks use `--tertiary`.
