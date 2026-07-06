import { Badge } from '@ui/components/base/badges/badges'
import {
  ENGAGEMENT_KEYS,
  ENGAGEMENT_LABELS,
  engagementPercentages,
} from '../engagement'
import type { EmailMetrics, EmailStatus } from '../types'
import { STATUS_BADGE_CLASS } from './statusBadgeStyles'

type Props = {
  metrics: EmailMetrics
  status: EmailStatus
}

/** Percentage badges for delivered, opened, clicked, and replied on sent emails. */
export default function EmailEngagementBadges({ metrics, status }: Props) {
  if (status !== 'sent') return null

  const percentages = engagementPercentages(metrics, status)

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
        Engagement
      </p>
      <div className="flex flex-wrap gap-2">
        {ENGAGEMENT_KEYS.map((key) => {
          const pct = percentages[key]
          return (
            <Badge
              key={key}
              type="color"
              color={pct > 0 ? 'success' : 'gray'}
              size="sm"
              className={`${STATUS_BADGE_CLASS} min-w-[7.25rem]`}
            >
              {ENGAGEMENT_LABELS[key]} {pct}%
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
