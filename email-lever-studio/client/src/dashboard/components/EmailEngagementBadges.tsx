import { Badge } from '@ui/components/base/badges/badges'
import { ENGAGEMENT_KEYS, emailEngagementState } from '../emailEngagement'
import type { EmailMetrics, EmailStatus } from '../types'

const LABELS: Record<(typeof ENGAGEMENT_KEYS)[number], string> = {
  delivered: 'Delivered',
  opened: 'Opened',
  clicked: 'Clicked',
  replied: 'Replied',
}

type Props = {
  metrics: EmailMetrics
  status: EmailStatus
}

export default function EmailEngagementBadges({ metrics, status }: Props) {
  if (status !== 'sent') return null

  const state = emailEngagementState(metrics, status)

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
        Engagement
      </p>
      <div className="flex flex-wrap gap-2">
        {ENGAGEMENT_KEYS.map((key) => (
          <Badge key={key} color={state[key] ? 'success' : 'gray'} size="sm">
            {LABELS[key]}
          </Badge>
        ))}
      </div>
    </div>
  )
}
