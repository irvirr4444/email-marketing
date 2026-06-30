# Lever — Cold Outreach Email Studio

A single-session writing tool for cold outreach emails. Mirrors Plane 2 (context) and Plane 1 (feature levers) from the internal schema — no database, no auth, no metrics.

**Frontend reference (layout, flow, components, design):** see [FRONTEND.md](FRONTEND.md) — intended for developers and AI assistants working on the UI.

## Setup

Uses the repo root `.env` (or local `.env`) with:

```
OPENAI_API_KEY=sk-...
```

```bash
cd email-lever-studio
npm install
npm run dev
```

Open [http://localhost:8000](http://localhost:8000). Vite proxies `/api/*` to Express on port 3001.

## Flow

1. **Context** — cold prospect fields + editable segment; name + email required
2. **Suggest Levers** (optional) — refresh AI suggestions for unlocked cards
3. **Generate Email** — fast path (suggest + draft) or draft-only if already suggested
4. **Draft** — subject, preheader, body — edit and copy

See [FRONTEND.md](FRONTEND.md) for full UI reference.

## Architecture

- [`shared/schema.ts`](shared/schema.ts) — single source of truth for types, field definitions, defaults, and OpenAI JSON schema
- `POST /api/suggest-levers` — input `ColdContext`, output `LeverSuggestion`
- `POST /api/generate-draft` — input `{ context, levers }`, output `{ subject, preheader?, body }`
- OpenAI key stays server-side only

## Manual QA

- [ ] Context: required name/email, optional collapsible section
- [ ] Levers: 3 badges + Intent + 8 cards with card-level lock
- [ ] Edit a control → card auto-locks with accent flash
- [ ] PAS vs AIDA on same context → different body structure
- [ ] Network tab: only `/api/*` calls, never `api.openai.com`
