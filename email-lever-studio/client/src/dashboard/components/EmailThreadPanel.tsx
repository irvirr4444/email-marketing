import { useMemo, useState } from 'react'
import { MessageChatCircle } from '@untitledui/icons'
import { Button } from '@ui/components/base/buttons/button'
import { TextArea } from '@ui/components/base/textarea/textarea'
import { cx } from '@/utils/cx'
import { getThreadForRecipient } from '../engagement'
import type {
  CampaignEmail,
  EmailThreadMessage,
  RecipientEngagement,
} from '../types'

function formatMessageTime(iso: string): string {
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

function firstName(name: string) {
  return name.split(/\s+/)[0] ?? name
}

type Props = {
  email: CampaignEmail
  recipient: RecipientEngagement | null
  onReplySent?: (message: string) => void
}

/** Right-pane thread view and mock reply composer. */
export default function EmailThreadPanel({
  email,
  recipient,
  onReplySent,
}: Props) {
  const [replyDraft, setReplyDraft] = useState('')
  const [localMessages, setLocalMessages] = useState<EmailThreadMessage[]>([])

  const baseMessages = useMemo(() => {
    if (!recipient) return []
    return getThreadForRecipient(email, recipient)
  }, [email, recipient])

  const messages = useMemo(
    () => [...baseMessages, ...localMessages],
    [baseMessages, localMessages],
  )

  if (!recipient) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-6 py-10">
        <MessageChatCircle
          className="size-10 text-fg-quaternary"
          aria-hidden
        />
        <p className="mt-3 text-center text-sm text-tertiary">
          Select a recipient to view their thread
        </p>
      </div>
    )
  }

  const handleSendReply = () => {
    const body = replyDraft.trim()
    if (!body) return

    const threadId =
      recipient.threadId ?? `thread-${email.id}-${recipient.recipientId}`
    const newMessage: EmailThreadMessage = {
      id: `local-${Date.now()}`,
      threadId,
      direction: 'outbound',
      from: 'outreach@cocacola.com',
      to: [recipient.email],
      subject: `Re: ${email.subject}`,
      body,
      sentAt: new Date().toISOString(),
    }

    setLocalMessages((prev) => [...prev, newMessage])
    setReplyDraft('')
    onReplySent?.(body)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="text-sm text-tertiary">No thread messages found yet.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cx(
                'rounded-xl px-4 py-3 ring-1 ring-inset',
                message.direction === 'outbound'
                  ? 'bg-secondary ring-secondary'
                  : 'bg-primary ring-secondary_alt',
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-secondary">
                  {message.direction === 'outbound' ? 'You' : recipient.name}
                </span>
                <span className="text-xs text-quaternary">
                  {formatMessageTime(message.sentAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                {message.body}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-secondary px-5 py-4">
        <TextArea
          label={`Reply to ${firstName(recipient.name)}`}
          size="sm"
          rows={3}
          value={replyDraft}
          onChange={setReplyDraft}
          placeholder={`Write a reply to ${firstName(recipient.name)}…`}
        />
        <div className="mt-3 flex justify-end">
          <Button
            size="sm"
            color="primary"
            onClick={handleSendReply}
            isDisabled={!replyDraft.trim()}
          >
            Send reply
          </Button>
        </div>
      </div>
    </div>
  )
}
