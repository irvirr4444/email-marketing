# Lever — Frontend Reference

This document describes the **current state** of the Email Lever Studio frontend (`email-lever-studio/`). It is written so an AI assistant (or new developer) can understand layout, behavior, data flow, and design conventions without reading every file.

**Version:** v3 — Refinement (split suggest/generate, editable segment, country/language comboboxes)  
**Last updated:** reflects v3 flow: Suggest Levers button, `leversSuggested` gate, `SegmentSelect`, `SearchableSelect` primitives.

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
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | None — single page, no router |
| State | React `useState` in `App.tsx` only (no Redux/Zustand) |
| Fonts | Inter (UI), Source Serif 4 (draft body) — Google Fonts in `index.html` |

---

## Page layout

### Overall structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: wordmark "Lever" (indigo, 22px)                    │
├──────────────┬────────────────────┬───────────────────────────┤
│  Context     │  Levers            │  Draft                    │
│  ~25% (3/12) │  ~35% (4/12)       │  ~40% (5/12)              │
│  col-span-3  │  col-span-4        │  col-span-5               │
└──────────────┴────────────────────┴───────────────────────────┘
```

- **Desktop (`lg+`):** 12-column grid, `max-w-7xl`, generous padding.
- **Mobile:** columns stack vertically (Context → Levers → Draft).
- **Background:** warm off-white `#FAFAF8`.
- **Borders:** subtle `#E5E3DE` — shadows used sparingly (mainly on Draft panel).

### Header

- Minimal top bar: only the wordmark **“Lever”** in accent indigo `#4F46E5`.
- White/translucent background, bottom border, light backdrop blur.
- No nav, no user menu, no subtitle.

---

## User flow (current behavior)

### 1. Levers are visible on load

The middle column shows **default levers immediately** (`DEFAULT_LEVER_SUGGESTION` from `shared/schema.ts`). The user can pre-set and lock any lever before suggesting or generating.

### 2. Lock levers (optional, anytime)

- **Auto-lock:** editing any control inside a card (or Intent) locks that card/intent and flashes an indigo border (`.lock-flash` animation).
- **Manual lock:** lock icon top-right of each card toggles lock without changing values.
- **Locked = fixed:** on suggest-levers, locked values are preserved via `mergeWithLocked()` on the server; AI only fills unlocked cards.

### 3. “Suggest Levers” (secondary action)

Button in the **Levers** panel, below metadata badges, above Intent card.

- Style: outline secondary (`border`, white bg, ink text) — **not** filled accent.
- Requires `recipientName` + `recipientEmail` (disabled + tooltip otherwise).
- Calls `POST /api/suggest-levers` only — **no draft**.
- Re-clickable after context edits to refresh unlocked cards without touching an existing draft.
- Sets `leversSuggested = true` on success.

### 4. “Generate Email” (primary action)

Button in the **Context** panel. Requires `recipientName` + `recipientEmail`.

| `leversSuggested` | Behavior |
|-------------------|----------|
| `false` | Fast path: suggest-levers → collapse context → generate-draft (two API calls) |
| `true` | Draft only: generate-draft with **current** levers — does **not** re-suggest or overwrite manual edits |

When `leversSuggested === true`, the existing draft is **not** cleared before generating (avoids blanking the panel during re-generate from context).

### 5. “Regenerate Email”

Button in **Levers** column after first draft. Draft-only (`generate-draft`), uses current levers.

### 6. Edit draft + copy

Draft subject, preheader, and body are editable inline. **Copy to clipboard** copies all three (preheader omitted if empty).

---

## Column 1 — Context (`ColdContextPanel`)

**File:** `src/components/ColdContextPanel.tsx`

### Expanded state (before / during edit)

- Section title: **Context**
- Subtitle: “Cold prospect — only fill what you actually know.”
- **`SegmentSelect`:** editable customer segment dropdown (12 Plane 2 values). Default `cold_prospect`. Custom pill trigger — not native `<select>`. Shows “Segment: {label} · First Touch”.

**Required fields:**

| Field | Type |
|-------|------|
| Recipient name | text input |
| Recipient email | email input |

**Optional collapsible:** “What do you know about them?”

Muted labels (`13px`, `#6B6960`):

| Field | Type |
|-------|------|
| Company | text |
| Industry | text |
| Role | text |
| Seniority | select: IC, Manager, Director, VP/C-level |
| Company size | select: 1-10, 11-50, 51-200, 200+ |
| Country | `CountrySelect` — searchable combobox with flag emoji (ISO 3166-1) |
| Language | `LanguageSelect` — searchable combobox, name + muted code (ISO 639-1) |

**Notes:** freeform textarea (why reaching out, LinkedIn post, etc.)

**Primary button:** `Generate Email` (full width, indigo). Disabled while loading or if name/email empty.

### Collapsed state (after generate)

- Summary card: To name/email, optional known fields, notes excerpt.
- **Edit context** link re-expands the form.

### Data shape (`ColdContext`)

- `segmentAtSend: CustomerSegment` — one of 12 values in `CUSTOMER_SEGMENT_OPTIONS`
- `sequenceNumber: 1` — hardcoded (not editable in v3)
- `country` / `language` — optional strings storing **human-readable names** (e.g. “United States”, “English”)

---

## Column 2 — Levers (`LeverPanel`)

**File:** `src/components/LeverPanel.tsx`

### Metadata badges

1. `{segmentLabel} · First Touch` — **read-only**, synced from `context.segmentAtSend` via prop
2. `Campaign: Cold Outreach` — static
3. `Email 1 · New Thread` — static

### Suggest Levers button

Outline secondary button between badges and Intent card. See user flow §3.

### Intent lever (Plane 1.2)

**File:** `src/components/IntentLever.tsx`

- Standalone card (not grouped with the 8 cards below).
- Segmented control, 6 options: Book Meeting, Drive Purchase, Get Reply, Click to Page, Collect Info, Referral.
- One AI reasoning line: `AI: {reasoning}`
- Own lock toggle; auto-locks on manual change.

### Eight grouped lever cards (Plane 1.3–1.9)

Rendered from `CARD_DEFINITIONS` in `shared/schema.ts` via `CardFields` + `LeverGroupCard`.

| Card | Key | Controls | Conditional UI |
|------|-----|----------|----------------|
| Subject Line | `subjectLine` | length, personalization, type, urgency, number, emoji, casing | always visible |
| Preheader | `preheader` | present, length, vs subject | length/relationship hidden when `present: false` |
| Sender | `sender` | name type, reply-to | always visible |
| Body | `body` | length, format, links, reading level, scannable | always visible |
| Copy Strategy | `copyStrategy` | framework, persuasion, emotion, specificity, personalization | always visible |
| CTA | `cta` | count, type, placement, style + **CTA copy text input** | ctaCopy always editable |
| Offer | `offer` | has offer, type, magnitude, scarcity | type/magnitude/scarcity hidden when `hasOffer: false` |

Each card:

- `rounded-xl` white card, subtle border, hover border darken.
- Title + one italic reasoning line at top.
- Lock icon top-right; locked cards get `ring-1 ring-indigo/20`.
- Dense layout: label left, control right (stacks on narrow widths).
- Staggered `fade-in` on load (`animation-delay` 30ms per card).

### Regenerate button

Only visible when `draft !== null`. Label: **Regenerate Email**.

---

## Column 3 — Draft (`DraftPanel`)

**File:** `src/components/DraftPanel.tsx`

- Visually **heaviest** column: `shadow-md`, extra padding, elevated white card.
- **Inbox-style preview** (editable fields styled to look like an email):

| Part | Style |
|------|--------|
| Subject | 18px, semibold, ink |
| Preheader | 13px, muted gray (optional) |
| Divider | 1px `#E5E3DE` |
| Body | Source Serif 4, 15px, `line-height: 1.65` |

- Empty state: dashed border placeholder — “Your draft will appear here after you generate.”
- Loading: skeleton blocks + “Drafting your email…”
- On new draft: `draft-fade-in` animation (keyed by `draftVersion` from App).
- Footer: Copy to clipboard + helper text about lever settings.

---

## UI primitives

| Component | File | Purpose |
|-----------|------|---------|
| `Badge` | `Badge.tsx` | Neutral metadata pills with dot |
| `SegmentSelect` | `SegmentSelect.tsx` | Custom dropdown for 12 customer segments |
| `SearchableSelect` | `SearchableSelect.tsx` | Generic searchable combobox (keyboard, clear, filter) |
| `CountrySelect` | `CountrySelect.tsx` | Wraps `SearchableSelect` + `shared/countries.ts` with flags |
| `LanguageSelect` | `LanguageSelect.tsx` | Wraps `SearchableSelect` + `shared/languages.ts` |
| `SegmentedControl` | `SegmentedControl.tsx` | Pill buttons; sliding indigo highlight |
| `ToggleSwitch` | `ToggleSwitch.tsx` | Custom switch (not native checkbox) |
| `LockIcon` | `LockIcon.tsx` | Filled when locked, outline when unlocked |
| `LeverGroupCard` | `LeverGroupCard.tsx` | Card shell: title, reasoning, lock, children |
| `CardFields` | `CardFields.tsx` | Renders fields from `CARD_DEFINITIONS` for a card key |
| `LoadingShimmer` | `LoadingShimmer.tsx` | `ThinkingMessage`, `GroupCardSkeleton`, `DraftSkeleton` |

**Control types:**

- `segmented` → `SegmentedControl` (compact mode in cards)
- `toggle` → `ToggleSwitch`
- `text` → small inline input (e.g. offer magnitude, CTA copy)

---

## Design system

### Colors

| Token | Hex | Usage |
|-------|-----|--------|
| Ink | `#1A1A18` | Primary text |
| Ink muted | `#6B6960` | Labels, meta, preheader |
| Background | `#FAFAF8` | Page bg |
| Border | `#E5E3DE` | Cards, inputs, dividers |
| Accent | `#4F46E5` | Buttons, active segments, locks, focus |
| Accent hover | `#4338CA` | Button hover |

Accent is used **sparingly** — primary actions, active segmented selection, lock-active states, focus rings.

### Typography scale

| Size | Use |
|------|-----|
| 22px | Page wordmark |
| 17px | Section headers (Context, Levers, Draft) |
| 15px | Body inputs, card titles, buttons |
| 13px | Meta, badges, field labels, reasoning |
| 18px | Draft subject |
| 15px serif | Draft body |

### Motion

- `lock-flash` — 600ms indigo ring when user edits a lever
- `fade-in` — lever cards on appear (staggered)
- `draft-fade-in` — draft panel on generate/regenerate
- Buttons: `150ms ease`, slight scale on press (`active:scale-[0.99]`)

No animation library — CSS only.

---

## State management (`App.tsx`)

All state lives in the root component:

```ts
context: ColdContext
contextCollapsed: boolean
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
| `handleSuggestLevers` | Levers “Suggest Levers” | suggest-levers only |
| `handleGenerateEmail` | Context “Generate Email” | suggest + draft if `!leversSuggested`, else draft only |
| `handleRegenerate` | Levers “Regenerate Email” | generate-draft only |

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
├── index.html              # fonts, title "Lever — Cold Outreach"
├── vite.config.ts          # port 8000, /api → 127.0.0.1:3001
├── shared/
│   ├── schema.ts             # types, CARD_DEFINITIONS, segments, merge helpers
│   ├── countries.ts          # ISO 3166-1 list + flag helper
│   └── languages.ts          # ISO 639-1 list
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api.ts
    ├── types.ts
    ├── index.css
    └── components/
        ├── ColdContextPanel.tsx
        ├── LeverPanel.tsx
        ├── SegmentSelect.tsx
        ├── SearchableSelect.tsx
        ├── CountrySelect.tsx
        ├── LanguageSelect.tsx
        ├── IntentLever.tsx
        ├── LeverGroupCard.tsx
        ├── CardFields.tsx
        ├── DraftPanel.tsx
        ├── SegmentedControl.tsx
        ├── ToggleSwitch.tsx
        ├── Badge.tsx
        ├── LockIcon.tsx
        └── LoadingShimmer.tsx
```

**Removed in v2 (do not recreate):** flat v1 `LeverCard`, `SliderLever`, `SegmentedLever`, `ContextPanel`, `src/constants.ts`.

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
- Campaign type lever (hardcoded badge: Cold Outreach)
- Sequence position lever (hardcoded badge: Email 1 · New Thread)
- Author/methodology style picker (deferred)
- Image support in drafts
- Send timing / daypart levers
- Multi-email thread view

---

## Related docs

- [`README.md`](README.md) — quick start + architecture summary
- [`../docs/PLANE_1_FEATURES.md`](../docs/PLANE_1_FEATURES.md) — lever taxonomy source of truth
- [`../docs/PLANE_2_CONTEXT.md`](../docs/PLANE_2_CONTEXT.md) — cold context field semantics
- [`../docs/PLANE_GUIDE.md`](../docs/PLANE_GUIDE.md) — overall plane architecture

---

## Quick checklist for AI making frontend changes

1. **Lever fields** — edit `CARD_DEFINITIONS` in `shared/schema.ts`, not ad-hoc in components.
2. **New control type** — extend `FieldDef` + `CardFields.tsx` + schema generator if needed.
3. **API shape changes** — update `shared/schema.ts`, server routes, and `src/api.ts` together.
4. **Styling** — use existing tokens (`#FAFAF8`, `#4F46E5`, `#E5E3DE`); keep accent sparse.
5. **Lock behavior** — any manual lever edit should set `locked: true` on that card/intent.
6. **Never call OpenAI from the browser** — only `/api/*`.
7. **Port** — frontend dev is **8000**, not 5173.
8. **Suggest vs Generate** — use `leversSuggested` gate; never re-suggest on Generate Email after first suggest unless user clicks Suggest Levers.
