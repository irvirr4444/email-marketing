import { Badge, BadgeWithIcon } from '@ui/components/base/badges/badges'
import { CheckCircle, Clock } from '@untitledui/icons'
import type { FC } from 'react'
import { cx } from '@/utils/cx'
import type { EmailFilters } from '../types'
import { STATUS_BADGE_CLASS, STATUS_FILTER_SELECTED_CLASS } from './statusBadgeStyles'

type StatusOption = {
  id: EmailFilters['status']
  label: string
  color: 'gray' | 'orange' | 'success'
  icon?: FC<{ className?: string }>
}

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'all', label: 'All', color: 'gray' },
  { id: 'pending', label: 'Pending', color: 'orange', icon: Clock },
  { id: 'sent', label: 'Sent', color: 'success', icon: CheckCircle },
]

type Props = {
  value: EmailFilters['status']
  onChange: (status: EmailFilters['status']) => void
}

/** Status filter chips (All / Pending / Sent) for the filters drawer. */
export default function StatusFilterChips({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OPTIONS.map((option) => {
        const selected = value === option.id
        const badge = option.icon ? (
          <BadgeWithIcon
            color={option.color}
            size="sm"
            iconLeading={option.icon}
            className={cx(
              STATUS_BADGE_CLASS,
              selected
                ? STATUS_FILTER_SELECTED_CLASS[option.color]
                : 'opacity-60 hover:opacity-100',
            )}
          >
            {option.label}
          </BadgeWithIcon>
        ) : (
          <Badge
            color={option.color}
            size="sm"
            className={cx(
              STATUS_BADGE_CLASS,
              selected
                ? STATUS_FILTER_SELECTED_CLASS[option.color]
                : 'opacity-60 hover:opacity-100',
            )}
          >
            {option.label}
          </Badge>
        )

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className="cursor-pointer rounded-md outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {badge}
          </button>
        )
      })}
    </div>
  )
}
