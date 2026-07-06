import { useEffect, useMemo, useState } from 'react'
import { CloseButton } from '@ui/components/base/buttons/close-button'
import {
  Dialog,
  Modal,
  ModalOverlay,
} from '@ui/components/application/modals/modal'
import { cx } from '@/utils/cx'
import {
  ENGAGEMENT_MODAL_SIGNALS,
  getEngagementSignalCounts,
  getEngagementSignalLabel,
  getRecipientEngagementBySignal,
} from '../engagement'
import { getCampaignById } from '../mock'
import type { CampaignEmail, EngagementSignal } from '../types'
import EmailThreadPanel from './EmailThreadPanel'
import RecipientEngagementList from './RecipientEngagementList'

function formatModalDate(sentAt: string | null): string {
  if (!sentAt) return ''
  const date = new Date(sentAt.includes('T') ? sentAt : `${sentAt}T00:00:00`)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`
}

type Props = {
  email: CampaignEmail
  signal: EngagementSignal | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/** Centered two-pane modal for recipient-level engagement drill-down. */
export default function EmailEngagementModal({
  email,
  signal,
  isOpen,
  onOpenChange,
}: Props) {
  const [activeSignal, setActiveSignal] = useState<EngagementSignal>('opened')
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (isOpen && signal) {
      setActiveSignal(signal)
      setSelectedRecipientId(null)
    }
  }, [isOpen, signal])

  const counts = useMemo(
    () => getEngagementSignalCounts(email),
    [email],
  )

  const recipients = useMemo(
    () => getRecipientEngagementBySignal(email, activeSignal),
    [email, activeSignal],
  )

  const selectedRecipient = useMemo(
    () =>
      recipients.find((row) => row.recipientId === selectedRecipientId) ??
      null,
    [recipients, selectedRecipientId],
  )

  useEffect(() => {
    if (
      selectedRecipientId &&
      !recipients.some((row) => row.recipientId === selectedRecipientId)
    ) {
      setSelectedRecipientId(null)
    }
  }, [recipients, selectedRecipientId])

  const campaign = getCampaignById(email.campaignId)
  const subtitle = [
    campaign?.name ?? 'Campaign',
    email.subject,
    formatModalDate(email.sentAt),
  ]
    .filter(Boolean)
    .join(' · ')

  const title = `${getEngagementSignalLabel(activeSignal)} · ${counts[activeSignal]} recipient${counts[activeSignal] === 1 ? '' : 's'}`

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="max-w-[min(96vw,112rem)]">
        <Dialog
          aria-label="Email engagement details"
          className="w-full max-w-[min(96vw,112rem)] outline-hidden"
        >
          <div className="flex h-[min(92dvh,880px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
            <div className="flex items-start gap-3 border-b border-secondary px-5 py-4 md:px-6">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                <p className="mt-0.5 truncate text-sm text-tertiary">
                  {subtitle}
                </p>
              </div>
              <CloseButton
                size="sm"
                label="Close engagement details"
                onPress={() => onOpenChange(false)}
              />
            </div>

            <div
              className="flex gap-0 border-b border-secondary px-5 md:px-6"
              role="tablist"
              aria-label="Engagement signals"
            >
              {ENGAGEMENT_MODAL_SIGNALS.map((tabSignal) => {
                const selected = activeSignal === tabSignal
                return (
                  <button
                    key={tabSignal}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      setActiveSignal(tabSignal)
                      setSelectedRecipientId(null)
                    }}
                    className={cx(
                      'relative px-3 py-3 text-sm font-medium transition-colors',
                      selected
                        ? 'text-brand-secondary'
                        : 'text-tertiary hover:text-secondary',
                    )}
                  >
                    {getEngagementSignalLabel(tabSignal)} ({counts[tabSignal]})
                    {selected && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-solid" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex h-full w-[min(100%,25rem)] shrink-0 flex-col overflow-hidden border-r border-secondary">
                <RecipientEngagementList
                  recipients={recipients}
                  signal={activeSignal}
                  selectedRecipientId={selectedRecipientId}
                  onSelect={setSelectedRecipientId}
                />
              </div>
              <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
                <EmailThreadPanel
                  key={selectedRecipientId ?? 'none'}
                  email={email}
                  recipient={selectedRecipient}
                />
              </div>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
