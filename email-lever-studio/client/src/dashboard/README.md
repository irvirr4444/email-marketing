# Campaign dashboard (client)

React UI for browsing campaigns, filtering emails, and approving/rejecting pending drafts. Lives under `client/src/dashboard/`.

**Dev:** from repo root run `npm run dev`, then open `http://localhost:5173/dashboard/campaign/camp-1`. Mock data is used in dev unless `VITE_USE_MOCK_DASHBOARD=false`.

## Layout

```
dashboard/
├── README.md                 ← this file
├── DashboardPage.tsx         ← main route shell
├── types.ts                  ← shared dashboard types + DEFAULT_FILTERS
├── mock.ts                   ← mock API data + client-side filter/sort
├── api.ts                    ← fetch vs mock switch
├── useDashboardData.ts       ← data loading hook
│
├── engagement/               ← engagement metrics + percent filters (see engagement/README.md)
│
├── components/               ← presentational + feature components
│   ├── EmailCard.tsx
│   ├── EngagementFilters.tsx
│   ├── EngagementPercentRangeRow.tsx
│   ├── EmailEngagementBadges.tsx
│   ├── StatusFilterChips.tsx
│   └── …
│
└── drawers/                  ← slide-out panels (Filters, Activity, Settings)
    └── FiltersDrawer.tsx
```

## Filters

`EmailFilters` in `types.ts` drives the filters drawer:

- **Status** — `all` | `pending` | `sent` (`StatusFilterChips`)
- **Engagement** — per-signal min/max % (`engagement/` module + `EngagementFilters`)
- **Variables** — intent, framework, emotion, etc. (`FiltersDrawer` native selects)

Filter application:

- **Mock path:** `mock.ts` → `filterEmails()` uses `matchesEngagementFilters()`
- **API path:** server should apply the same rules when implemented

Engagement details: **[engagement/README.md](./engagement/README.md)**

## UI rules

All interactive controls use **Untitled UI** (`@ui/...`). See `.cursor/rules/untitled-ui.mdc`.

## Files safe to delete

Nothing else in `dashboard/` should be removed for the engagement refactor. These are **already gone** — do not recreate:

| Path | Why removed |
|------|-------------|
| `dashboard/emailEngagement.ts` | Split into `engagement/constants.ts`, `range.ts`, `metrics.ts` |

## Optional cleanup outside this folder

| Path | Notes |
|------|--------|
| `.cursor/plans/*.plan.md` | Cursor agent plans from past tasks; safe to delete locally if you no longer need them. Not in git. |
| Root `docs/PLANE_*.md` | Product/architecture docs for the bandit pipeline — **keep**; unrelated to dashboard engagement UI. |

## Related server code

| Path | Role |
|------|------|
| `email-lever-studio/server/dashboard/` | API routes + store for live dashboard data |
