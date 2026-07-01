# Lever — Frontend Reference

This document describes the **current state** of the Email Lever Studio frontend (`email-lever-studio/`). It is written so an AI assistant (or new developer) can understand layout, behavior, data flow, and design conventions without reading every file.

**Version:** v7 — Pipeline layout, unified width, calm interactions  
**Last updated:** reflects pipeline Style section, Relationship as its own step, per-field emphasis, click-to-deselect chips, conditional Draft mount, always-visible context.

Design spec (historical): [`../frontend_revamp.md`](../frontend_revamp.md)

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

### Overall structure (v7)

One scrollable page with **fixed StepRail** (desktop) and five content blocks (Draft is conditional):

```
┌────┬────────────────────────────────────────────────────────┐
│ ●  │  Sticky AppBar + [Generate email]                      │
│ │  ├────────────────────────────────────────────────────────┤
│ ●  │  max-w-7xl px-6:                                         │
│ │  │    Recipient → Draft (if exists) → Relationship →        │
│ ●  │    Intent → Style (pipeline)                             │
│ ●  │                                                          │
└────┴────────────────────────────────────────────────────────┘
  StepRail (lg+, fixed left) — Recipient · Relationship · Intent · Style
```

- **Width:** all sections use `max-w-7xl` (`App.tsx`, `AppBar.tsx`).
- **Spacing:** `space-y-12` between major sections; `space-y-3` within sections.
- **Section IDs:** `section-recipient`, `section-draft` (conditional), `section-relationship`, `section-intent`, `section-style` — each has `scroll-margin-top: 80px` for StepRail / AppBar offset.
- **Main padding:** `lg:pl-[7.5rem]` to clear the fixed StepRail.

### AppBar (`AppBar.tsx`)

- Sticky, 64px, `--surface` background.
- **Elevate on scroll:** `box-shadow` fades in after `scrollY > 0` (`.app-bar.elevated`).
- **Left:** "Lever" (Inter 700, 20px) + subtitle `Cold Outreach · Email 1` (hidden on mobile).
- **Right:** status text (`Suggesting…` / `Drafting…`) + filled pill primary button.
- **Button:** `Generate email` → `Regenerate email` when `draft !== null`.
- Disabled until `recipientName` + `recipientEmail` filled; tooltip: `Add a name and email to generate.`

### StepRail (`StepRail.tsx`)

Four steps (Draft is **not** in the rail):

| Step | Section ID |
|------|------------|
| Recipient | `section-recipient` |
| Relationship | `section-relationship` |
| Intent | `section-intent` |
| Style | `section-style` |

- Scroll-spy via `getActiveIndex()` with 96px offset.
- Click scrolls to section (`scrollIntoView`).
- Mobile: FAB menu with same four steps.

---

## User flow (current behavior)

### 1. Levers are visible on load

Default levers show immediately (`DEFAULT_LEVER_SUGGESTION` from `shared/schema.ts`). Style controls appear **visually idle** until the user interacts or AI recommends (see [Style emphasis model](#style-emphasis-model)).

### 2. Lock levers (after AI recommend)

- **Auto-lock:** editing any control inside a style card **after** `leversSuggested === true` sets `locked: true` on that card.
- **Manual lock:** `lock` / `lock_open` icon on each style card — visible only after recommend.
- **Locked = fixed:** on suggest-levers, locked values are preserved via `mergeWithLocked()` on the server; AI only fills unlocked cards.
- **Intent** has no lock UI in the current build.

### 3. "Recommend styles for this context" (secondary action)

**Filled pill button** in the Style section header (`StyleSection.tsx`), class `.recommend-styles-btn`.

- Calls `POST /api/suggest-levers` only — **no draft**.
- Requires `recipientName` + `recipientEmail` (disabled while loading or if fields empty).
- Sets `leversSuggested = true` on success; all style fields then show AI values.
- Re-triggerable after context edits to refresh unlocked cards without touching an existing draft.

### 4. "Generate email" (primary action)

**Filled button** in sticky `AppBar`. Requires `recipientName` + `recipientEmail`. Relationship must also be selected (`segmentAtSend` non-empty) — validated server-side.

| `leversSuggested` | Behavior |
|-------------------|----------|
| `false` | Fast path: suggest-levers → generate-draft (two API calls) |
| `true` | Draft only: generate-draft with **current** levers — does **not** re-suggest or overwrite manual edits |

When `leversSuggested === false`, generate clears draft before the fast path. When `leversSuggested === true`, existing draft is **not** cleared before re-generate.

### 5. "Regenerate email"

Same AppBar button when `draft !== null`. Calls `handleRegenerate` → draft-only (`generate-draft`), uses current levers.

### 6. Edit draft + copy

Draft subject, preheader (if non-empty), and body are inline-editable. **Copy to clipboard** copies all three (preheader omitted if empty).

---

## Section 1 — Recipient (`RecipientSection.tsx`)

Plain section (no card chrome):

- Title: **Who you're writing to**
- Two Material outlined text fields: Recipient name, Recipient email (side-by-side desktop, stack mobile).
- **Optional context** (`ContextDetails.tsx`) is **always visible** beneath — no expand/collapse toggle.

### Optional context (`ContextDetails.tsx`)

Subtitle: "Add anything you actually know about them — the rest stays unset."

| Field | Control |
|-------|---------|
| Company, Industry, Role | Outlined text fields |
| Seniority, Company size | `OutlinedMenuField` (Material menu) |
| Country | `CountryField` — autocomplete with flag emoji |
| Language | `LanguageField` — autocomplete with dim ISO code |
| Notes | Multiline textarea |

### Data shape (`ColdContext`)

- `segmentAtSend: CustomerSegment | ''` — empty until user picks a relationship (see Section 2)
- `sequenceNumber: 1` — hardcoded (not editable)
- `country` / `language` — optional strings storing **human-readable names** (e.g. "United States", "English")

---

## Section 2 — Relationship (`SegmentSelector.tsx`)

Standalone section between Draft (when shown) and Intent:

- Panel with label **Relationship** and 12-segment card grid (`role="radiogroup"`).
- Each option: icon, label, hint (`SEGMENT_META` in component).
- Badge in header shows current selection (hidden when none selected).
- **Click-to-deselect:** clicking the active segment clears selection (`segmentAtSend: ''`).
- Required before API calls (`validateColdContext` on server).

---

## Section 3 — Draft (`DraftCard.tsx`) — conditional hero

Mounted only when `draft !== null || loadingDraft` (`App.tsx`).

- **`.card-primary`** + `--surface-paper` (`#FFFEFB`) background, `p-8`, 20px radius.
- Subject: **20px** Roboto 500; body: **17px / 1.7** Source Serif 4.
- **Loading:** skeleton shimmer (3–4 bars), not linear progress.
- Fade-through on `draftVersion`; copy button turns `--success` when copied.
- No empty placeholder when absent — section simply not rendered.

---

## Section 4 — Intent (`IntentChips.tsx`)

- Title: **What's the goal of this email?** (`.section-title`)
- Filter chips use `--primary` / `--primary-container` when selected.
- **Click-to-deselect:** clicking the active chip clears selection (`value: ''`); API falls back to default `get_reply` via `pickEnum`.
- No lock button, no AI reasoning line in current UI.

---

## Section 5 — Style (`StyleSection.tsx`)

> **Style cross-reference index** — every place Style is documented in this file:
>
> | Topic | Section |
> |-------|---------|
> | Page position & section ID | [Page layout](#page-layout) |
> | Recommend button & `leversSuggested` | [User flow §3](#3-recommend-styles-for-this-context-secondary-action) |
> | Lock semantics | [User flow §2](#2-lock-levers-after-ai-recommend), [Lock semantics](#lock-semantics-important-for-ai-assistants) |
> | Pipeline rows & cards | [Pipeline layout](#pipeline-layout) below |
> | Field emphasis / idle state | [Style emphasis model](#style-emphasis-model) |
> | Chip & toggle behavior | [StyleField controls](#stylefield-controls) |
> | Card shells | [StyleGroupCard](#stylegroupcard) |
> | Schema / field definitions | [Types & schema](#types--schema), `CARD_DEFINITIONS` in `shared/schema.ts` |
> | CSS classes | [Style CSS](#style-css-indexcss) |
> | Components table | [UI primitives](#ui-primitives) |
> | File paths | [File map](#file-map-frontend) |
> | AI change checklist | [Quick checklist](#quick-checklist-for-ai-making-frontend-changes) |
> | Color roles for chips | [Design system → Colors](#colors-material-3-light-scheme) |
> | Hidden / removed UI fields | [Style fields not in UI](#style-fields-not-in-ui) |

- Title: **Style** (`.section-title`)
- Subtitle: "Recommend styles for your context, then lock anything you want to keep."
- Primary action in header: **Recommend styles for this context** (`.recommend-styles-btn`, `auto_awesome` icon).
- Container: `.style-pipeline` — labeled rows inside a rounded panel (`border`, `--surface-container`, `p-3 md:p-4`).
- Disabled overlay (`pointer-events-none opacity-60`) while `loadingLevers || loadingDraft`.

### Pipeline layout

Rows follow the logical email structure (not an asymmetric bento grid):

| Row label | Cards | Layout |
|-----------|-------|--------|
| **Inbox** | Subject Line | 1 col |
| **Preview** | Preheader, Sender | 2 col (`md:grid-cols-2`) |
| **Message** | Body | 1 col |
| **Persuasion** | Copy Strategy | 1 col |
| **Action** | Call to Action, Offer | 2 col |

Row labels use `.style-row-label` (11px uppercase tracking). Rows separated by `.style-row + .style-row` top border.

### Card variants (`StyleGroupCard`)

| Variant | Cards | Surface class |
|---------|-------|---------------|
| `primary` | Subject Line, Body | `.card-primary` when active; `.card-idle` when subdued |
| `supporting` | Preheader, Sender, Copy Strategy, CTA, Offer | `.card-supporting` when active; `.card-idle` when subdued |

- **`subdued={!leversSuggested}`** — before recommend, cards use `.card-idle` (flat, no tier shadow).
- **Lock UI** — `showLock={leversSuggested}`; locked highlight `.card-locked` only when `leversSuggested && locked`.
- **AI reasoning** — `showReasoning={leversSuggested}`; `auto_awesome` icon in `--secondary`.
- Card title: 14px Roboto 500. Padding: `p-5` primary, `p-4` supporting.

### Style emphasis model

`StyleSection` tracks `touchedFields: Set<string>` keyed as `"cardKey.fieldKey"`.

A field is **emphasized** (shows its real value/selection) when:

```ts
leversSuggested || touchedFields.has(`${cardKey}.${fieldKey}`)
```

Before emphasize:

- **Choice chips** — none selected visually (`selected={false}`).
- **Toggles** — appear off (`checked={false}`).
- **CTA copy** input — empty until emphasized.

After **Recommend styles** (`leversSuggested = true`), all fields show AI-suggested values. Per-field touch still works for individual edits.

### StyleField controls

Rendered from `CARD_DEFINITIONS` in `shared/schema.ts` (`StyleField.tsx`).

| Control type | Behavior |
|--------------|----------|
| **Segmented (choice chips)** | `MaterialChip` variant `choice`; selected uses `--secondary-container` / `--secondary`. **Click active chip again to deselect** (`value: ''` → schema default on API). No **None** option chips in UI (persuasion/scarcity use deselect instead). |
| **Toggle** | `MaterialSwitch`; batched horizontally. Per-field emphasis — clicking one toggle does not activate siblings. |
| **Text** | Inline after label (e.g. Offer magnitude); `max-w-[140px]`. |
| **CTA copy** | Separate text field below CTA card fields; placeholder until emphasized. |
| **`hiddenWhen`** | Child fields stay **visible but disabled** (`.style-field-row-inactive`), not removed from DOM. |

**Layouts:**

- `inline` — default; label + chips on one row where space allows.
- `stacked` — CTA card; uppercase `.field-micro-label` above chip groups.
- Copy Strategy always uses micro-labels regardless of layout prop.
- Subject Line, Body, Copy Strategy use a 2-col field grid on `sm+`.

### Style CSS (`index.css`)

| Class | Purpose |
|-------|---------|
| `.style-pipeline` | Flex column, 20px gap |
| `.style-row` | Row wrapper + 8px inner gap |
| `.style-row-label` | Uppercase row heading (Inbox, Preview, …) |
| `.style-field-row` | Single field row; tinted `--surface-container-high` bg |
| `.style-field-row-inactive` | Reduced opacity for disabled-by-parent fields |
| `.style-field-label` | 12px field label (inline layout) |
| `.field-micro-label` | 10px uppercase label (stacked / Copy Strategy) |
| `.style-field-controls` | Chip/toggle cluster |
| `.card-idle` | Pre-recommend flat card surface |
| `.recommend-styles-btn` | Tonal filled recommend CTA in Style header |

### Style fields not in UI

These remain in schema/types/API defaults but are **not** rendered in `CARD_DEFINITIONS`:

- Subject Line `personalizationToken` (toggle)
- Copy Strategy `framework` (segmented)

Persuasion `none` and Offer scarcity `none` are valid API values but have **no chip** — use click-to-deselect to clear.

---

## UI primitives

| Component | File | Purpose |
|-----------|------|---------|
| `MaterialIcon` | `MaterialIcon.tsx` | Material Symbols Outlined wrapper (`filled` prop) |
| `MaterialChip` | `MaterialChip.tsx` | Choice (`secondary`) and filter (`primary`) chips |
| `MaterialSwitch` | `MaterialSwitch.tsx` | M3 switch track/thumb |
| `LockButton` | `LockButton.tsx` | `lock` / `lock_open` icon button |
| `AutocompleteField` | `AutocompleteField.tsx` | M3 outlined autocomplete + elevated menu (keyboard nav) |
| `CountryField` | `CountryField.tsx` | Wraps autocomplete + `shared/countries.ts` flags |
| `LanguageField` | `LanguageField.tsx` | Wraps autocomplete + `shared/languages.ts` codes |
| `OutlinedMenuField` | `OutlinedMenuField.tsx` | Outlined dropdown for enum fields (seniority, company size) |
| `AppBar` | `AppBar.tsx` | Sticky header, status, primary action |
| `StepRail` | `StepRail.tsx` | Scroll-spy nav (fixed rail desktop, FAB mobile) |
| `RecipientSection` | `RecipientSection.tsx` | Name/email + always-visible context |
| `ContextDetails` | `ContextDetails.tsx` | Optional context grid |
| `SegmentSelector` | `SegmentSelector.tsx` | Relationship card grid |
| `DraftCard` | `DraftCard.tsx` | Draft preview, loading, copy |
| `IntentChips` | `IntentChips.tsx` | Intent filter chips |
| `StyleSection` | `StyleSection.tsx` | Pipeline orchestration, recommend button, `touchedFields` |
| `StyleGroupCard` | `StyleGroupCard.tsx` | Single lever card shell |
| `StyleField` | `StyleField.tsx` | Field renderer from `CARD_DEFINITIONS` |

**Removed (do not recreate):** `ColdContextPanel`, `LeverPanel`, `DraftPanel`, `CardFields`, `LeverGroupCard`, `SegmentedControl`, `ToggleSwitch`, `SearchableSelect`, `SegmentSelect`, `CountrySelect`, `LanguageSelect`, `Badge`, `LockIcon`, `LoadingShimmer`, v4 `console/` scaffolding, asymmetric bento grid (`.style-bento*`), Style "Suggest levers" switch, Intent lock/reasoning UI, context expand/collapse.

---

## Design system

### Colors (Material 3 light scheme)

| Token | Hex | Usage |
|-------|-----|--------|
| `--surface` | `#FFFFFF` | Page background |
| `--surface-container` | `#F8F9FE` | Section/card backgrounds |
| `--surface-container-high` | `#EEF1FA` | Style field rows, hover |
| `--outline` | `#C4C7CE` | Outlined field borders |
| `--outline-variant` | `#E3E5EC` | Hairline dividers, pipeline row separators |
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
| `.card-idle` | Pre-recommend style cards — flat, no elevation |
| `.card-locked` | 3px left border `--tertiary` when locked (post-recommend only) |

### Typography

| Role | Size | Face |
|------|------|------|
| Section titles | clamp(28px, 4vw, 32px) | Inter 700 (`.section-title`) |
| Card titles | 13–14px | Roboto 500 |
| Draft subject | 20px | Roboto 500 |
| Draft body | 17px / 1.7 | Source Serif 4 |
| Pipeline row labels | 11px uppercase | Roboto 600 |

### Geometry

- Border radius: 16px section cards, 8px fields/buttons, pill chips and primary button.
- Elevation utilities: `.elevation-1` through `.elevation-3` in `index.css`.
- Spacing: 8px base grid; `space-y-12` between major sections.

### Motion

| Pattern | Class / trigger | Duration |
|---------|-----------------|----------|
| Fade-through (draft) | `.fade-through-out/in` on `draftVersion` | 150ms each |
| AppBar elevate | `.app-bar.elevated` on scroll | 150ms |
| Skeleton shimmer | draft loading bars | continuous |
| Ripple | disabled on `main .m-ripple::after` | — |

`prefers-reduced-motion`: shortens fade-through; disables skeleton shimmer and step-rail pulse.

No animation library — CSS only. No lock-settle flash, no chip click flash.

### Interaction

- `cursor: pointer` on buttons, chips, switches, segment cards, recommend CTA.
- Toggle `:hover` scoped to unchecked state so checked switches stay green.

---

## State management (`App.tsx`)

All state lives in the root component:

```ts
context: ColdContext
levers: LeverSuggestion           // always populated (defaults on load)
leversSuggested: boolean          // true after any successful suggest-levers
draft: EmailDraft | null
loadingLevers: boolean
loadingDraft: boolean
draftVersion: number
error: string | null
```

`StyleSection` owns local `touchedFields` (not lifted to App).

**Handlers:**

| Handler | Trigger | API calls |
|---------|---------|-----------|
| `handleSuggestLevers` | Style "Recommend styles…" button | suggest-levers only |
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

### Style lever cards (`CARD_DEFINITIONS`)

| Card key | Label | Notable fields |
|----------|-------|----------------|
| `subjectLine` | Subject Line | length, type, urgency/number/emoji toggles, casing |
| `preheader` | Preheader | present toggle; length, vs Subject (disabled when present off) |
| `sender` | Sender | nameType, reply-to toggle |
| `body` | Body | length, format, links, reading level, scannable toggle |
| `copyStrategy` | Copy Strategy | persuasion, emotion, specificity, personalization depth |
| `cta` | Call to Action | count, type, placement, style + CTA copy text |
| `offer` | Offer | hasOffer toggle; type, magnitude, scarcity (disabled when hasOffer off) |

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
    ├── index.css           # M3 tokens, pipeline, step-rail, segment grid, switches
    └── components/
        ├── StepRail.tsx
        ├── AppBar.tsx
        ├── RecipientSection.tsx
        ├── ContextDetails.tsx
        ├── SegmentSelector.tsx
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
- On **suggest-levers**, server runs `mergeWithLocked(aiSuggestion, existingLevers)` — locked cards keep user values; AI reasoning on locked cards may update.
- On **generate-draft**, all current values (locked or not) drive the written email.
- Regenerate does **not** re-suggest levers — only rewrites the draft.
- Auto-lock on edit only applies **after** `leversSuggested === true`.

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
- Subject Line personalization toggle
- Copy Strategy framework picker
- Explicit "None" chips for persuasion / scarcity

---

## Related docs

- [`README.md`](README.md) — quick start + architecture summary
- [`../frontend_revamp.md`](../frontend_revamp.md) — historical v5 Sheet design spec
- [`../docs/PLANE_1_FEATURES.md`](../docs/PLANE_1_FEATURES.md) — lever taxonomy source of truth
- [`../docs/PLANE_2_CONTEXT.md`](../docs/PLANE_2_CONTEXT.md) — cold context field semantics
- [`../docs/PLANE_GUIDE.md`](../docs/PLANE_GUIDE.md) — overall plane architecture

---

## Quick checklist for AI making frontend changes

1. **Lever fields** — edit `CARD_DEFINITIONS` in `shared/schema.ts`, not ad-hoc in components.
2. **New control type** — extend `FieldDef` + `StyleField.tsx` + schema generator if needed.
3. **API shape changes** — update `shared/schema.ts`, server routes, and `src/api.ts` together.
4. **Styling** — use M3 CSS variables from `index.css`; pipeline layout in `.style-pipeline` / `.style-row*`.
5. **Lock behavior** — auto-lock only after `leversSuggested`; manual lock via `LockButton` on cards.
6. **Field emphasis** — respect `touchedFields` / `isFieldEmphasized`; don't show selections before touch or recommend.
7. **Never call OpenAI from the browser** — only `/api/*`.
8. **Port** — frontend dev is **8000**, not 5173.
9. **Suggest vs Generate** — use `leversSuggested` gate; never re-suggest on Generate email after first suggest unless user clicks Recommend styles again.
10. **Layout** — single-column scroll; Style uses pipeline rows, not bento grid; StepRail uses four section IDs.
11. **Copy** — sentence case for actions (`Generate email`, not `Generate Email`).
12. **Color roles** — reserve `--primary` for Generate button + Intent chips; style chips use `--secondary`; locks use `--tertiary`.
13. **Chips** — support click-to-deselect; don't add "None" option chips when deselect covers that case.
