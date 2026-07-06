# Engagement module

Percent-based engagement metrics and filters for the campaign dashboard (delivered, opened, clicked, replied).

Import from the barrel:

```ts
import {
  ENGAGEMENT_KEYS,
  ENGAGEMENT_LABELS,
  engagementPercentages,
  matchesEngagementFilters,
  applyEngagementRangeMin,
} from '../engagement'
```

## File map

| File | Responsibility |
|------|----------------|
| `constants.ts` | Signal keys, display order, labels — **single source of truth** for which signals exist |
| `range.ts` | Min/max percent filter logic (parse, clamp, normalize, apply, match) |
| `metrics.ts` | Derive percentages from `EmailMetrics`, filter emails, delivered count |
| `index.ts` | Re-exports public API |

## UI consumers (not in this folder)

| File | Uses |
|------|------|
| `components/EngagementFilters.tsx` | Composes status + engagement sections in the filters drawer |
| `components/EngagementPercentRangeRow.tsx` | One min/max row; calls `applyEngagementRangeMin` / `applyEngagementRangeMax` |
| `components/StatusFilterChips.tsx` | All / Pending / Sent chips |
| `components/EmailEngagementBadges.tsx` | Percent badges on sent email cards |
| `drawers/FiltersDrawer.tsx` | `hasActiveEngagementFilters` for the “On” badge |
| `mock.ts` | `matchesEngagementFilters` when filtering mock data |
| `types.ts` | `EngagementRangeFilter`, `EmailFilters.engagement`, `createEmptyEngagementFilters()` |

## Range filter behavior

- Bounds are **inclusive** percentages from **0 to 100**.
- **Empty bound** (`null`) means no limit on that side (e.g. min `20`, max empty → “at least 20%”).
- **Both empty** → signal ignored (matches any percent).
- **Min > max** while typing: the other bound is adjusted so `min ≤ max` (`applyEngagementRangeMin` / `applyEngagementRangeMax`).
- **Min > max** at filter time: bounds are swapped (`normalizeEngagementRange`) so results stay predictable.
- **Pending emails**: excluded when any engagement range is active; included when all engagement ranges are empty.

## Adding a new signal

1. Add the key to `EngagementKey` and `ENGAGEMENT_KEYS` in `constants.ts`.
2. Add a label in `ENGAGEMENT_LABELS`.
3. Map the metric in `engagementPercentages()` in `metrics.ts`.
4. Add an icon in `ENGAGEMENT_SIGNAL_ICONS` in `EngagementFilters.tsx`.
5. `EmailFilters.engagement` and `DEFAULT_FILTERS` update automatically via `createEmptyEngagementFilters()`.

No changes needed in `range.ts` unless the new signal uses different bounds.

## Deleted / replaced (do not restore)

| Removed | Replaced by |
|---------|-------------|
| `dashboard/emailEngagement.ts` | This `engagement/` folder |
| Yes/no engagement toggles on filters | Min–max percent inputs |
| `emailEngagementState()` | Removed — was unused legacy from yes/no filters |

If you see imports from `./emailEngagement` or `../emailEngagement`, update them to `./engagement` or `../engagement`.
