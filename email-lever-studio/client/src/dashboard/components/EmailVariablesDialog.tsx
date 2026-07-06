import { CloseButton } from '@ui/components/base/buttons/close-button'
import {
  Dialog,
  Modal,
  ModalOverlay,
} from '@ui/components/application/modals/modal'
import type { EmailVariableSnapshot } from '@shared/email-variables.ts'
import EmailVariables from './EmailVariables'
import { StyleStarsIcon } from './StyleStarsIcon'

/** max-w-lg (32rem) + 35% ≈ 43rem */
const MODAL_MAX_WIDTH = 'max-w-[43rem]'

type Props = {
  snapshot: EmailVariableSnapshot
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export default function EmailVariablesDialog({
  snapshot,
  isOpen,
  onOpenChange,
}: Props) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
      <Modal className={MODAL_MAX_WIDTH}>
        <Dialog
          aria-label="Email style"
          className={`w-full ${MODAL_MAX_WIDTH} outline-hidden`}
        >
          <div className="flex max-h-[min(85dvh,640px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
            <div className="flex items-center gap-3 border-b border-secondary px-5 py-3.5 md:px-6">
              <h2 className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold text-primary">
                <StyleStarsIcon className="size-5 shrink-0 text-fg-brand-primary" />
                Style
              </h2>
              <CloseButton
                size="sm"
                label="Close style"
                onPress={() => onOpenChange(false)}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
              <EmailVariables snapshot={snapshot} />
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
