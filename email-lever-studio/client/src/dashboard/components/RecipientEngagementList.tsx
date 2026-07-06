import { Avatar } from '@ui/components/base/avatar/avatar'
import { cx } from '@/utils/cx'
import {
  formatActivityTime,
  getRecipientLastActivityAt,
} from '../engagement'
import type { EngagementSignal, RecipientEngagement } from '../types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

type Props = {
  recipients: RecipientEngagement[]
  signal: EngagementSignal
  selectedRecipientId: string | null
  onSelect: (recipientId: string) => void
}

/** Left-pane recipient list for the engagement drill-down modal. */
export default function RecipientEngagementList({
  recipients,
  signal,
  selectedRecipientId,
  onSelect,
}: Props) {
  if (recipients.length === 0) {
    return (
      <div className="flex h-full flex-1 items-center justify-center px-4 py-8">
        <p className="text-center text-sm text-tertiary">
          No recipients for this signal yet.
        </p>
      </div>
    )
  }

  return (
    <ul className="flex h-full flex-col overflow-y-auto">
      {recipients.map((recipient) => {
        const selected = selectedRecipientId === recipient.recipientId
        const time = formatActivityTime(
          getRecipientLastActivityAt(recipient, signal),
        )

        return (
          <li key={recipient.recipientId}>
            <button
              type="button"
              onClick={() => onSelect(recipient.recipientId)}
              aria-pressed={selected}
              className={cx(
                'grid w-full cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-secondary px-4 py-3 text-left transition-colors',
                selected ? 'bg-secondary' : 'hover:bg-primary_hover',
              )}
            >
              <Avatar
                size="sm"
                initials={initials(recipient.name)}
                alt={recipient.name}
              />
              <p className="min-w-0 truncate text-center text-sm font-medium text-primary">
                {recipient.name}
              </p>
              <span className="min-w-[2.5rem] shrink-0 text-right text-xs text-quaternary">
                {time ?? ''}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
