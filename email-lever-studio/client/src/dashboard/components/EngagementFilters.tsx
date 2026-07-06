import {
  CursorClick01,
  Eye,
  Mail01,
  MessageChatCircle,
} from '@untitledui/icons'
import type { FC } from 'react'
import {
  ENGAGEMENT_KEYS,
  ENGAGEMENT_LABELS,
  type EngagementKey,
} from '../engagement'
import type { EmailFilters, EngagementRangeFilter } from '../types'
import EngagementPercentRangeRow from './EngagementPercentRangeRow'
import { FilterSectionBlock } from './FilterSection'
import StatusFilterChips from './StatusFilterChips'

const ENGAGEMENT_SIGNAL_ICONS: Record<EngagementKey, FC<{ className?: string }>> =
  {
    delivered: Mail01,
    opened: Eye,
    clicked: CursorClick01,
    replied: MessageChatCircle,
  }

type Props = {
  filters: EmailFilters
  onChange: (filters: EmailFilters) => void
}

/** Status and engagement metric filters for the campaign email list. */
export default function EngagementFilters({ filters, onChange }: Props) {
  const setEngagement = (key: EngagementKey, value: EngagementRangeFilter) => {
    onChange({
      ...filters,
      engagement: { ...filters.engagement, [key]: value },
    })
  }

  const setStatus = (status: EmailFilters['status']) => {
    onChange({ ...filters, status })
  }

  return (
    <>
      <FilterSectionBlock title="Status">
        <StatusFilterChips value={filters.status} onChange={setStatus} />
      </FilterSectionBlock>

      <FilterSectionBlock title="Metrics">
        <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary ring-inset">
          <p className="text-sm font-medium text-secondary">Recipient engagement</p>
          <p className="mt-0.5 text-xs text-tertiary">
            Filter by min–max % for each signal. Leave blank for any.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {ENGAGEMENT_KEYS.map((key) => (
              <EngagementPercentRangeRow
                key={key}
                label={ENGAGEMENT_LABELS[key]}
                icon={ENGAGEMENT_SIGNAL_ICONS[key]}
                value={filters.engagement[key]}
                onChange={(value) => setEngagement(key, value)}
              />
            ))}
          </div>
        </div>
      </FilterSectionBlock>
    </>
  )
}
