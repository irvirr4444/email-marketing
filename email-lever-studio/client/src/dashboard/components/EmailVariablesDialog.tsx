import { CloseButton } from '@ui/components/base/buttons/close-button'
import {
  Dialog,
  Modal,
  ModalOverlay,
} from '@ui/components/application/modals/modal'
import type { EmailVariableSnapshot } from '@shared/email-variables.ts'
import EmailVariables from './EmailVariables'
import { StyleStarsIcon } from './StyleStarsIcon'

/** Wide enough for two section columns without internal scroll. */
const MODAL_MAX_WIDTH = 'max-w-[56rem]'

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
          <div className="flex w-full flex-col rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
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

            <div className="px-5 py-4 md:px-6">
              <EmailVariables snapshot={snapshot} />
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
