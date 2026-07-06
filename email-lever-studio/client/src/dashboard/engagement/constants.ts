/**
 * Engagement signals tracked on sent campaign emails.
 * Shared by filter UI, badges, and matching logic.
 */
export type EngagementKey = 'delivered' | 'opened' | 'clicked' | 'replied'

/** Canonical order for rendering and iterating engagement signals. */
export const ENGAGEMENT_KEYS: EngagementKey[] = [
  'delivered',
  'opened',
  'clicked',
  'replied',
]

/** Human-readable labels keyed by {@link EngagementKey}. */
export const ENGAGEMENT_LABELS: Record<EngagementKey, string> = {
  delivered: 'Delivered',
  opened: 'Opened',
  clicked: 'Clicked',
  replied: 'Replied',
}
