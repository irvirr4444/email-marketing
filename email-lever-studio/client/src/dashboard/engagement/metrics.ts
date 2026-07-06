import type {
  CampaignEmail,
  EmailMetrics,
  EmailStatus,
  EngagementRangeFilter,
} from '../types'
import type { EngagementKey } from './constants'
import { ENGAGEMENT_KEYS } from './constants'
import {
  hasActiveEngagementFilters,
  isEngagementRangeActive,
  percentMatchesEngagementRange,
} from './range'

/** Engagement rates (0–100) derived from bulk-send metrics. */
export function engagementPercentages(
  metrics: EmailMetrics,
  status: EmailStatus,
): Record<EngagementKey, number> {
  if (status !== 'sent' || metrics.sent <= 0) {
    return { delivered: 0, opened: 0, clicked: 0, replied: 0 }
  }

  const delivered = metrics.delivered ?? metrics.sent

  return {
    delivered: Math.round((delivered / metrics.sent) * 100),
    opened: metrics.openRate,
    clicked: metrics.clickRate,
    replied: metrics.replyRate,
  }
}

/** Delivered recipient count for display; falls back to sent when delivery is unknown. */
export function deliveredCount(
  metrics: EmailMetrics,
  status: EmailStatus,
): number {
  if (status !== 'sent') return 0
  if (metrics.delivered != null) return metrics.delivered
  return metrics.sent > 0 ? metrics.sent : 0
}

/**
 * Whether an email passes all active engagement percentage filters.
 * Pending (non-sent) emails are excluded when any engagement filter is active.
 */
export function matchesEngagementFilters(
  email: CampaignEmail,
  engagement: Record<EngagementKey, EngagementRangeFilter>,
): boolean {
  const hasActiveRange = hasActiveEngagementFilters(engagement)

  if (email.status !== 'sent') {
    return !hasActiveRange
  }

  const percentages = engagementPercentages(email.metrics, email.status)

  return ENGAGEMENT_KEYS.every((key) => {
    const range = engagement[key]
    if (!isEngagementRangeActive(range)) return true
    return percentMatchesEngagementRange(percentages[key], range)
  })
}
