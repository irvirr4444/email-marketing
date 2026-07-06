import { useRef, useState, type KeyboardEvent } from 'react'
import { Tag, TagGroup, TagList } from '@ui/components/base/tags/tags'
import type { EmailRecipient } from '../types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function nameFromEmail(email: string) {
  return (
    email.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ??
    email
  )
}

type Props = {
  recipients: EmailRecipient[]
  editable?: boolean
  onChange?: (recipients: EmailRecipient[]) => void
}

export default function EmailRecipients({
  recipients,
  editable = false,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')

  const handleRemove = (id: string) => {
    onChange?.(recipients.filter((recipient) => recipient.id !== id))
  }

  const handleAdd = () => {
    const trimmedEmail = draft.trim().toLowerCase()
    if (!isValidEmail(trimmedEmail)) return
    if (recipients.some((r) => r.email.toLowerCase() === trimmedEmail)) {
      setDraft('')
      return
    }

    onChange?.([
      ...recipients,
      {
        id: `rcp-${Date.now()}`,
        name: nameFromEmail(trimmedEmail),
        email: trimmedEmail,
        avatar: null,
      },
    ])
    setDraft('')
    inputRef.current?.focus()
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      if (draft.trim()) {
        e.preventDefault()
        handleAdd()
      }
      return
    }

    if (e.key === 'Backspace' && draft === '' && recipients.length > 0) {
      handleRemove(recipients[recipients.length - 1].id)
    }
  }

  if (recipients.length === 0 && !editable) return null

  const chipList =
    recipients.length > 0 ? (
      <TagGroup label="Email recipients" size="sm" className="min-w-0">
        <TagList className="flex flex-wrap gap-1">
          {recipients.map((recipient) => (
            <Tag
              key={recipient.id}
              id={recipient.id}
              avatarSrc={recipient.avatar ?? undefined}
              onClose={editable ? () => handleRemove(recipient.id) : undefined}
              className={
                editable
                  ? '!bg-transparent !px-0 !shadow-none !ring-0 hover:!bg-primary_hover'
                  : undefined
              }
            >
              <span title={recipient.name}>{recipient.email}</span>
            </Tag>
          ))}
        </TagList>
      </TagGroup>
    ) : null

  if (!editable) {
    return (
      <div className="flex items-start gap-3">
        <span className="w-6 shrink-0 pt-1 text-xs font-medium text-quaternary">
          To
        </span>
        <div className="min-w-0 flex-1">{chipList}</div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3">
      <span className="w-6 shrink-0 pt-1 text-xs font-medium text-quaternary">
        To
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {recipients.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">{chipList}</div>
        )}
        <input
          ref={inputRef}
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={() => {
            if (draft.trim()) handleAdd()
          }}
          placeholder={
            recipients.length === 0 ? 'Add email addresses' : 'Add more'
          }
          className="h-7 w-full border-0 bg-transparent px-0 text-sm text-primary outline-none placeholder:text-placeholder"
          aria-label="Add recipient email"
        />
      </div>
    </div>
  )
}

export { initials }
