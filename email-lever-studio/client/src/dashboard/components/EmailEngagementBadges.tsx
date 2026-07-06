import { Badge } from '@ui/components/base/badges/badges'
import {
  ENGAGEMENT_KEYS,
  ENGAGEMENT_LABELS,
  engagementPercentages,
} from '../engagement'
import type { EmailMetrics, EmailStatus, EngagementSignal } from '../types'
import { STATUS_BADGE_CLASS } from './statusBadgeStyles'

type Props = {
  metrics: EmailMetrics
  status: EmailStatus
  onSignalClick?: (signal: EngagementSignal) => void
}

/** Percentage badges for delivered, opened, clicked, and replied on sent emails. */
export default function EmailEngagementBadges({
  metrics,
  status,
  onSignalClick,
}: Props) {
  if (status !== 'sent') return null

  const percentages = engagementPercentages(metrics, status)

  return (
    <div className="border-t border-secondary pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
        Engagement
      </p>
      <div className="flex flex-wrap gap-2">
        {ENGAGEMENT_KEYS.map((key) => {
          const pct = percentages[key]
          const label = `${ENGAGEMENT_LABELS[key]} ${pct}%`
          const badge = (
            <Badge
              type="color"
              color={pct > 0 ? 'success' : 'gray'}
              size="sm"
              className={`${STATUS_BADGE_CLASS} min-w-[7.25rem]`}
            >
              {label}
            </Badge>
          )

          if (!onSignalClick) {
            return <span key={key}>{badge}</span>
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSignalClick(key)}
              aria-label={`View ${ENGAGEMENT_LABELS[key].toLowerCase()} recipients`}
              className="cursor-pointer appearance-none border-0 bg-transparent p-0 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {badge}
            </button>
          )
        })}
      </div>
    </div>
  )
}
