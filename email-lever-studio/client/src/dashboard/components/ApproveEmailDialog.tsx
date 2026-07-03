import type { ReactNode } from 'react'
import { Send01 } from '@untitledui/icons'
import { Badge } from '@ui/components/base/badges/badges'
import { Button } from '@ui/components/base/buttons/button'
import { CloseButton } from '@ui/components/base/buttons/close-button'
import {
  Dialog,
  Modal,
  ModalOverlay,
} from '@ui/components/application/modals/modal'
import { FeaturedIcon } from '@ui/components/foundations/featured-icon/featured-icon'
import type { CampaignEmail } from '../types'
import EmailRecipients from './EmailRecipients'

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
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
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
            <div className="flex items-start gap-4 border-b border-secondary px-5 py-4 md:px-6">
              <FeaturedIcon
                icon={Send01}
                color="brand"
                theme="modern"
                size="md"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-primary">
                  Confirm send
                </h2>
                <p className="mt-1 text-sm text-tertiary">
                  Review the full email and recipients before approving.
                </p>
              </div>
              <CloseButton
                size="sm"
                label="Close confirmation"
                onPress={() => onOpenChange(false)}
              />
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 md:px-6">
              <ReviewSection title="Recipients">
                <EmailRecipients recipients={email.recipients} />
              </ReviewSection>

              {email.recipientContext && (
                <ReviewSection title="Recipient context">
                  <div className="flex flex-wrap gap-2">
                    {email.recipientContext.segment && (
                      <Badge color="gray" size="sm">
                        Segment: {email.recipientContext.segment}
                      </Badge>
                    )}
                    {email.recipientContext.industry && (
                      <Badge color="gray" size="sm">
                        Industry: {email.recipientContext.industry}
                      </Badge>
                    )}
                    {email.recipientContext.role && (
                      <Badge color="gray" size="sm">
                        Role: {email.recipientContext.role}
                      </Badge>
                    )}
                    {email.recipientContext.companyName && (
                      <Badge color="gray" size="sm">
                        Company: {email.recipientContext.companyName}
                      </Badge>
                    )}
                  </div>
                </ReviewSection>
              )}

              <ReviewSection title="Subject">
                <p className="text-md font-semibold text-primary">{email.subject}</p>
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
