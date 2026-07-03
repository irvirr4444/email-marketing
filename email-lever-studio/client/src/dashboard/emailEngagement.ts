import type { CampaignEmail, EmailMetrics, EmailStatus } from './types'

export type EngagementKey = 'delivered' | 'opened' | 'clicked' | 'replied'

export const ENGAGEMENT_KEYS: EngagementKey[] = [
  'delivered',
  'opened',
  'clicked',
  'replied',
]

export type EngagementState = Record<EngagementKey, boolean>

export function emailEngagementState(
  metrics: EmailMetrics,
  status: EmailStatus,
): EngagementState {
  const delivered =
    status === 'sent' &&
    (metrics.delivered == null ? metrics.sent > 0 : metrics.delivered > 0)

  return {
    delivered,
    opened: metrics.opens > 0,
    clicked: metrics.clicks > 0,
    replied: metrics.replies > 0,
  }
}

export function deliveredCount(
  metrics: EmailMetrics,
  status: EmailStatus,
): number {
  if (status !== 'sent') return 0
  if (metrics.delivered != null) return metrics.delivered
  return metrics.sent > 0 ? metrics.sent : 0
}

export function matchesEngagementFilters(
  email: CampaignEmail,
  engagement: Record<EngagementKey, boolean | null>,
): boolean {
  const state = emailEngagementState(email.metrics, email.status)

  for (const key of ENGAGEMENT_KEYS) {
    const filter = engagement[key]
    if (filter === null) continue
    if (state[key] !== filter) return false
  }

  return true
}
