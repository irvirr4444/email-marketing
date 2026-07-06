import { useEffect, useState, type ReactNode } from 'react'
import { Send01 } from '@untitledui/icons'
import { Button } from '@ui/components/base/buttons/button'
import { CloseButton } from '@ui/components/base/buttons/close-button'
import { Input } from '@ui/components/base/input/input'
import {
  Dialog,
  Modal,
  ModalOverlay,
} from '@ui/components/application/modals/modal'
import type { CampaignEmail } from '../types'

type Props = {
  email: CampaignEmail
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function ReviewSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-tertiary">
        {title}
      </p>
      {children}
    </div>
  )
}

export default function ApproveEmailDialog({
  email,
  isOpen,
  onOpenChange,
  onConfirm,
}: Props) {
  const [generateCount, setGenerateCount] = useState(1)

  useEffect(() => {
    if (isOpen) setGenerateCount(1)
  }, [isOpen])

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className="max-w-2xl">
        <Dialog
          aria-label="Confirm email approval"
          className="w-full max-w-2xl outline-hidden"
        >
          <div className="flex max-h-[min(85dvh,720px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
            <div className="flex items-center gap-3 border-b border-secondary px-5 py-3.5 md:px-6">
              <h2 className="flex min-w-0 flex-1 items-center gap-2 font-display text-lg font-semibold text-primary">
                <Send01 className="size-5 shrink-0 text-fg-brand-primary" />
                Confirm send
              </h2>
              <CloseButton
                size="sm"
                label="Close confirmation"
                onPress={() => onOpenChange(false)}
              />
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="approve-generate-count"
                  className="text-sm font-medium text-primary"
                >
                  How many emails should we generate?
                </label>
                <Input
                  id="approve-generate-count"
                  className="w-[5.5rem] shrink-0"
                  type="number"
                  size="md"
                  min={1}
                  max={50}
                  value={String(generateCount)}
                  onChange={(value) => {
                    const parsed = parseInt(value, 10)
                    setGenerateCount(
                      Number.isFinite(parsed)
                        ? Math.min(50, Math.max(1, parsed))
                        : 1,
                    )
                  }}
                  aria-label="Number of emails to generate"
                />
              </div>

              <ReviewSection title="Subject">
                <p className="font-display text-md font-semibold text-primary">
                  {email.subject}
                </p>
              </ReviewSection>

              {email.preheader?.trim() && (
                <ReviewSection title="Preheader">
                  <p className="text-sm italic text-tertiary">{email.preheader}</p>
                </ReviewSection>
              )}

              <ReviewSection title="Body">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary">
                  {email.body}
                </p>
              </ReviewSection>
            </div>

            <div className="flex gap-2 border-t border-secondary px-5 py-4 md:px-6">
              <Button
                color="secondary"
                size="md"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                size="md"
                className="flex-1 shadow-xs"
                onClick={handleConfirm}
              >
                Confirm &amp; send
              </Button>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
