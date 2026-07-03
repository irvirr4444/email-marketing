import {
  ButtonGroup,
  ButtonGroupItem,
} from '@ui/components/base/button-group/button-group'
import { Badge, BadgeWithIcon } from '@ui/components/base/badges/badges'
import {
  CheckCircle,
  Clock,
  CursorClick01,
  Eye,
  Mail01,
  MessageChatCircle,
} from '@untitledui/icons'
import type { FC } from 'react'
import { cx } from '@/utils/cx'
import type { EngagementKey } from '../emailEngagement'
import type { EmailFilters } from '../types'
import { FilterSectionBlock } from './FilterSection'
import { STATUS_BADGE_CLASS, STATUS_FILTER_SELECTED_CLASS } from './statusBadgeStyles'

type TriState = boolean | null

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

function StatusFilterChips({
  value,
  onChange,
}: {
  value: EmailFilters['status']
  onChange: (status: EmailFilters['status']) => void
}) {
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

const SIGNALS: {
  key: EngagementKey
  label: string
  icon: FC<{ className?: string }>
}[] = [
  { key: 'delivered', label: 'Delivered', icon: Mail01 },
  { key: 'opened', label: 'Opened', icon: Eye },
  { key: 'clicked', label: 'Clicked', icon: CursorClick01 },
  { key: 'replied', label: 'Replied', icon: MessageChatCircle },
]

function triStateKey(value: TriState): 'any' | 'yes' | 'no' {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return 'any'
}

function triStateFromKey(key: string): TriState {
  if (key === 'yes') return true
  if (key === 'no') return false
  return null
}

type TriStateRowProps = {
  label: string
  icon: FC<{ className?: string }>
  value: TriState
  onChange: (value: TriState) => void
}

function TriStateRow({ label, icon: Icon, value, onChange }: TriStateRowProps) {
  const selected = triStateKey(value)

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs ring-1 ring-secondary ring-inset">
          <Icon className="size-3.5 text-fg-quaternary" />
        </span>
        <span className="text-sm font-medium text-secondary">{label}</span>
      </div>
      <ButtonGroup
        size="sm"
        selectionMode="single"
        selectedKeys={new Set([selected])}
        onSelectionChange={(keys) => {
          const key = [...keys][0]
          onChange(key ? triStateFromKey(String(key)) : null)
        }}
      >
        <ButtonGroupItem id="any" className="min-w-11 px-2.5">
          Any
        </ButtonGroupItem>
        <ButtonGroupItem id="yes" className="min-w-11 px-2.5">
          Yes
        </ButtonGroupItem>
        <ButtonGroupItem id="no" className="min-w-11 px-2.5">
          No
        </ButtonGroupItem>
      </ButtonGroup>
    </div>
  )
}

type Props = {
  filters: EmailFilters
  onChange: (filters: EmailFilters) => void
}

export default function EngagementFilters({ filters, onChange }: Props) {
  const setEngagement = (key: EngagementKey, value: TriState) => {
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
            Match emails by yes/no signals — same as on each card.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            {SIGNALS.map((signal) => (
              <TriStateRow
                key={signal.key}
                label={signal.label}
                icon={signal.icon}
                value={filters.engagement[signal.key]}
                onChange={(value) => setEngagement(signal.key, value)}
              />
            ))}
          </div>
        </div>
      </FilterSectionBlock>
    </>
  )
}
