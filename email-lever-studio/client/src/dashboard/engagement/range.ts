import type { EngagementRangeFilter } from '../types'
import type { EngagementKey } from './constants'
import { ENGAGEMENT_KEYS } from './constants'

/** Inclusive lower bound for engagement percentage filters. */
export const ENGAGEMENT_PERCENT_MIN = 0

/** Inclusive upper bound for engagement percentage filters. */
export const ENGAGEMENT_PERCENT_MAX = 100

/** Clamp a number to a valid engagement percentage (0–100, rounded). */
export function clampEngagementPercent(value: number): number {
  return Math.min(
    ENGAGEMENT_PERCENT_MAX,
    Math.max(ENGAGEMENT_PERCENT_MIN, Math.round(value)),
  )
}

/**
 * Parse a min/max filter input.
 * Empty input means "no bound"; invalid numbers are ignored.
 */
export function parseEngagementPercentInput(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return null
  return clampEngagementPercent(parsed)
}

/** Format a bound for controlled number inputs (`null` → empty string). */
export function formatEngagementRangeBound(value: number | null): string {
  return value == null ? '' : String(value)
}

/**
 * Normalize inverted ranges (min > max) by swapping bounds.
 * Open-ended ranges (only min or only max) are left unchanged.
 */
export function normalizeEngagementRange(
  range: EngagementRangeFilter,
): EngagementRangeFilter {
  const { min, max } = range
  if (min == null || max == null || min <= max) return { min, max }
  return { min: max, max: min }
}

/** True when either bound is set for this signal. */
export function isEngagementRangeActive(
  range: EngagementRangeFilter,
): boolean {
  return range.min != null || range.max != null
}

/** True when any engagement signal has an active min/max filter. */
export function hasActiveEngagementFilters(
  engagement: Record<EngagementKey, EngagementRangeFilter>,
): boolean {
  return ENGAGEMENT_KEYS.some((key) =>
    isEngagementRangeActive(engagement[key]),
  )
}

/**
 * Apply a new minimum while preserving min ≤ max when both bounds are set.
 * Raising min above max bumps max up to match.
 */
export function applyEngagementRangeMin(
  range: EngagementRangeFilter,
  min: number | null,
): EngagementRangeFilter {
  const max =
    min != null && range.max != null && min > range.max ? min : range.max
  return { min, max }
}

/**
 * Apply a new maximum while preserving min ≤ max when both bounds are set.
 * Lowering max below min pulls min down to match.
 */
export function applyEngagementRangeMax(
  range: EngagementRangeFilter,
  max: number | null,
): EngagementRangeFilter {
  const min =
    max != null && range.min != null && range.min > max ? max : range.min
  return { min, max }
}

/**
 * True when `percent` falls within the normalized range.
 * An empty range (both bounds null) matches any percent.
 */
export function percentMatchesEngagementRange(
  percent: number,
  range: EngagementRangeFilter,
): boolean {
  const { min, max } = normalizeEngagementRange(range)
  if (min == null && max == null) return true
  if (min != null && percent < min) return false
  if (max != null && percent > max) return false
  return true
}
