import { useCallback, useEffect, useState } from 'react'
import { Calendar, Check, CheckCircle, Clock, Edit02, XClose } from '@untitledui/icons'
import { Badge, BadgeWithIcon } from '@ui/components/base/badges/badges'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import { TextArea } from '@ui/components/base/textarea/textarea'
import { patchEmail } from '../api'
import { getVisibleVariableSections } from '@shared/email-variables.ts'
import type { CampaignEmail, EmailRecipient } from '../types'
import ApproveEmailDialog from './ApproveEmailDialog'
import DashboardSnackbar from './DashboardSnackbar'
import RejectEmailDialog from './RejectEmailDialog'
import EmailEngagementBadges from './EmailEngagementBadges'
import EmailRecipients from './EmailRecipients'
import EmailVariablesDialog from './EmailVariablesDialog'
import { StyleStarsIcon } from './StyleStarsIcon'
import { STATUS_BADGE_CLASS } from './statusBadgeStyles'

type DisplayStatus = CampaignEmail['status'] | 'rejected'

type EmailDraft = {
  subject: string
  preheader: string
  body: string
}

type Props = {
  email: CampaignEmail
  onEmailUpdated?: (email: CampaignEmail) => void
}

function parseSentAt(value: string): Date {
  if (value.includes('T')) return new Date(value)
  return new Date(`${value}T00:00:00`)
}

function formatSentDate(value: string): string {
  const date = parseSentAt(value)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatSentTime24(value: string): string {
  const date = parseSentAt(value)
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function EmailCardTimestamp({
  sentAt,
  status,
}: {
  sentAt: string | null
  status: DisplayStatus
}) {
  if (status === 'pending') {
    return (
      <p className="text-xs font-medium text-tertiary">Awaiting approval</p>
    )
  }

  if (status === 'rejected') {
    return <p className="text-xs font-medium text-tertiary">Rejected</p>
  }

  if (!sentAt) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-tertiary">
        <Calendar className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden />
        {formatSentDate(sentAt)}
      </span>
      <span className="inline-flex items-center gap-1 text-xs font-medium text-tertiary">
        <Clock className="size-3.5 shrink-0 text-fg-quaternary" aria-hidden />
        {formatSentTime24(sentAt)}
      </span>
    </div>
  )
}

function toDraft(email: CampaignEmail): EmailDraft {
  return {
    subject: email.subject,
    preheader: email.preheader ?? '',
    body: email.body,
  }
}

const ACTION_BUTTON_CLASS =
  'min-w-[5rem] justify-center rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 ease-out active:scale-[0.97] *:data-icon:size-3.5 *:data-icon:stroke-[2px]'

const REJECT_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} hover:bg-error-primary hover:text-error-primary`

export default function EmailCard({ email, onEmailUpdated }: Props) {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus>(email.status)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<EmailDraft>(() => toDraft(email))
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [variablesOpen, setVariablesOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    message: string
    variant: 'brand' | 'error'
  } | null>(null)

  const isPending = displayStatus === 'pending'
  const hasVariables = getVisibleVariableSections(email.variables).length > 0

  useEffect(() => {
    if (!isEditing) {
      setDraft(toDraft(email))
    }
  }, [email, isEditing])

  const dismissSnackbar = useCallback(() => setSnackbar(null), [])

  const handleApprove = () => {
    setDisplayStatus('sent')
    setSnackbar({
      message: 'Email approved and queued for send.',
      variant: 'brand',
    })
  }

  const handleReject = () => {
    setDisplayStatus('rejected')
    setSnackbar({
      message: 'Email rejected.',
      variant: 'error',
    })
  }

  const startEditing = () => {
    setDraft(toDraft(email))
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setDraft(toDraft(email))
    setIsEditing(false)
  }

  const handleSave = async () => {
    const trimmedSubject = draft.subject.trim()
    const trimmedBody = draft.body.trim()
    if (!trimmedSubject || !trimmedBody) {
      setSnackbar({
        message: 'Subject and body are required.',
        variant: 'error',
      })
      return
    }

    const patch = {
      subject: trimmedSubject,
      preheader: draft.preheader.trim() || null,
      body: trimmedBody,
    }

    setIsSaving(true)
    try {
      const updated = await patchEmail(email.id, patch)
      onEmailUpdated?.(updated)
      setIsEditing(false)
      setSnackbar({ message: 'Changes saved successfully.', variant: 'brand' })
    } catch {
      const updated = { ...email, ...patch }
      onEmailUpdated?.(updated)
      setIsEditing(false)
      setSnackbar({ message: 'Changes saved successfully.', variant: 'brand' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRecipientsChange = async (recipients: EmailRecipient[]) => {
    try {
      const updated = await patchEmail(email.id, { recipients })
      onEmailUpdated?.(updated)
    } catch {
      onEmailUpdated?.({ ...email, recipients })
    }
  }

  const statusBadge =
    displayStatus === 'sent' ? (
      <BadgeWithIcon
        type="color"
        color="success"
        size="sm"
        iconLeading={CheckCircle}
        className={STATUS_BADGE_CLASS}
      >
        Sent
      </BadgeWithIcon>
    ) : displayStatus === 'rejected' ? (
      <Badge type="color" color="error" size="sm" className={STATUS_BADGE_CLASS}>
        Rejected
      </Badge>
    ) : (
      <BadgeWithIcon
        type="color"
        color="orange"
        size="sm"
        iconLeading={Clock}
        className={STATUS_BADGE_CLASS}
      >
        Pending
      </BadgeWithIcon>
    )

  return (
    <>
      <article
        className={
          isEditing
            ? 'rounded-2xl bg-primary shadow-md ring-2 ring-brand/30 ring-secondary_alt'
            : 'rounded-2xl bg-primary shadow-md ring-1 ring-secondary_alt'
        }
      >
        <div className="border-b border-secondary px-5 py-4 md:px-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <EmailCardTimestamp
                sentAt={email.sentAt}
                status={displayStatus}
              />
              <div className="flex items-center gap-2">
                {hasVariables && (
                  <button
                    type="button"
                    onClick={() => setVariablesOpen(true)}
                    aria-label="View email style"
                    className="cursor-pointer appearance-none border-0 bg-transparent p-0 outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <BadgeWithIcon
                      type="color"
                      color="brand"
                      size="sm"
                      iconLeading={StyleStarsIcon}
                      className={STATUS_BADGE_CLASS}
                    >
                      Style
                    </BadgeWithIcon>
                  </button>
                )}
                {statusBadge}
              </div>
            </div>
            {isEditing ? (
              <Input
                label="Subject"
                size="md"
                value={draft.subject}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, subject: value }))
                }
                inputClassName="font-semibold"
              />
            ) : (
              <h3 className="text-md font-semibold text-primary">{email.subject}</h3>
            )}
            {!isPending && (
              <EmailRecipients
                recipients={email.recipients}
                onChange={(recipients) => void handleRecipientsChange(recipients)}
              />
            )}
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6">
          {isEditing ? (
            <Input
              label="Preheader"
              size="sm"
              value={draft.preheader}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, preheader: value }))
              }
              placeholder="Optional preview line"
              inputClassName="italic"
              hint="Shown after the subject in many inboxes"
            />
          ) : (
            email.preheader?.trim() && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                  Preheader
                </p>
                <p className="text-sm italic text-tertiary">{email.preheader}</p>
              </div>
            )
          )}

          <div>
            {isEditing ? (
              <TextArea
                label="Body"
                size="sm"
                rows={8}
                value={draft.body}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, body: value }))
                }
              />
            ) : (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                  Body
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                  {email.body}
                </p>
              </>
            )}
          </div>

          <EmailEngagementBadges
            metrics={email.metrics}
            status={displayStatus === 'sent' ? 'sent' : email.status}
          />

          {isPending && isEditing && (
            <div className="flex items-center justify-end gap-2 border-t border-secondary pt-3">
              <Button
                size="xs"
                color="secondary"
                className={ACTION_BUTTON_CLASS}
                onClick={cancelEditing}
                isDisabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                color="primary"
                iconLeading={Check}
                className={`${ACTION_BUTTON_CLASS} shadow-xs hover:-translate-y-px hover:shadow-md`}
                onClick={() => void handleSave()}
                isLoading={isSaving}
                isDisabled={isSaving}
              >
                Save changes
              </Button>
            </div>
          )}

          {isPending && !isEditing && (
            <div className="flex items-center justify-end gap-2 border-t border-secondary pt-3">
              <Button
                size="xs"
                color="tertiary"
                iconLeading={Edit02}
                className={`${ACTION_BUTTON_CLASS} hover:bg-primary_hover`}
                onClick={startEditing}
              >
                Edit
              </Button>
              <span className="h-3 w-px bg-border-secondary" aria-hidden />
              <Button
                size="xs"
                color="secondary"
                iconLeading={XClose}
                className={REJECT_BUTTON_CLASS}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
              <span className="h-3 w-px bg-border-secondary" aria-hidden />
              <Button
                size="xs"
                color="primary"
                iconLeading={Check}
                className={`${ACTION_BUTTON_CLASS} shadow-xs hover:-translate-y-px hover:shadow-md`}
                onClick={() => setApproveOpen(true)}
              >
                Approve
              </Button>
            </div>
          )}
        </div>
      </article>

      <ApproveEmailDialog
        email={email}
        isOpen={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={handleApprove}
      />

      <RejectEmailDialog
        email={email}
        isOpen={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
      />

      {hasVariables && (
        <EmailVariablesDialog
          snapshot={email.variables}
          isOpen={variablesOpen}
          onOpenChange={setVariablesOpen}
        />
      )}

      {snackbar && (
        <DashboardSnackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={dismissSnackbar}
        />
      )}
    </>
  )
}
