import { Input } from '@ui/components/base/input/input'
import type { FC } from 'react'
import {
  applyEngagementRangeMax,
  applyEngagementRangeMin,
  ENGAGEMENT_PERCENT_MAX,
  ENGAGEMENT_PERCENT_MIN,
  formatEngagementRangeBound,
  parseEngagementPercentInput,
} from '../engagement/range'
import type { EngagementRangeFilter } from '../types'

export type EngagementPercentRangeRowProps = {
  label: string
  icon: FC<{ className?: string }>
  value: EngagementRangeFilter
  onChange: (value: EngagementRangeFilter) => void
}

/**
 * Min–max percent inputs for a single engagement signal filter row.
 */
export default function EngagementPercentRangeRow({
  label,
  icon: Icon,
  value,
  onChange,
}: EngagementPercentRangeRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs ring-1 ring-secondary ring-inset">
          <Icon className="size-3.5 text-fg-quaternary" />
        </span>
        <span className="text-sm font-medium text-secondary">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Input
          size="sm"
          type="number"
          min={ENGAGEMENT_PERCENT_MIN}
          max={ENGAGEMENT_PERCENT_MAX}
          placeholder="Min"
          value={formatEngagementRangeBound(value.min)}
          onChange={(next) =>
            onChange(
              applyEngagementRangeMin(value, parseEngagementPercentInput(next)),
            )
          }
          className="w-[4.5rem]"
          aria-label={`${label} minimum percent`}
        />
        <span className="px-0.5 text-xs text-quaternary">–</span>
        <Input
          size="sm"
          type="number"
          min={ENGAGEMENT_PERCENT_MIN}
          max={ENGAGEMENT_PERCENT_MAX}
          placeholder="Max"
          value={formatEngagementRangeBound(value.max)}
          onChange={(next) =>
            onChange(
              applyEngagementRangeMax(value, parseEngagementPercentInput(next)),
            )
          }
          className="w-[4.5rem]"
          aria-label={`${label} maximum percent`}
        />
        <span className="pl-0.5 text-xs text-tertiary">%</span>
      </div>
    </div>
  )
}
