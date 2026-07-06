import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Building07 } from '@untitledui/icons'
import { Button } from '@ui/components/base/buttons/button'
import { CloseButton } from '@ui/components/base/buttons/close-button'
import { Input } from '@ui/components/base/input/input'
import {
  Dialog,
  Modal,
  ModalOverlay,
} from '@ui/components/application/modals/modal'
import AppSnackbar from '../../components/AppSnackbar'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => { ok: true } | { ok: false; error: string }
}

export default function AddCompanyDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: Props) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    message: string
    variant: 'error'
  } | null>(null)

  const dismissSnackbar = useCallback(() => setSnackbar(null), [])

  useEffect(() => {
    if (isOpen) {
      setName('')
      setSubmitting(false)
      setSnackbar(null)
    }
  }, [isOpen])

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault()
    if (submitting) return

    setSubmitting(true)
    const result = onConfirm(name)
    setSubmitting(false)

    if (!result.ok) {
      setSnackbar({ message: result.error, variant: 'error' })
      return
    }

    onOpenChange(false)
  }

  return (
    <>
      <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
        <Modal className="max-w-md">
          <Dialog
            aria-label="Add company"
            className="w-full max-w-md outline-hidden"
          >
            <div className="flex w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
              <div className="flex items-center gap-3 border-b border-secondary px-5 py-3.5 md:px-6">
                <h2 className="flex min-w-0 flex-1 items-center gap-2 font-display text-lg font-semibold text-primary">
                  <Building07 className="size-5 shrink-0 text-fg-brand-primary" />
                  Add company
                </h2>
                <CloseButton
                  size="sm"
                  label="Close"
                  onPress={() => onOpenChange(false)}
                />
              </div>

              <form
                className="space-y-4 px-5 py-5 md:px-6"
                onSubmit={handleSubmit}
              >
                <Input
                  label="Company name"
                  placeholder="Company Name"
                  value={name}
                  onChange={setName}
                  autoFocus
                />

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    color="secondary"
                    size="md"
                    onClick={() => onOpenChange(false)}
                    isDisabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    color="primary"
                    size="md"
                    isLoading={submitting}
                    isDisabled={submitting}
                  >
                    Create company
                  </Button>
                </div>
              </form>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>

      {snackbar && (
        <AppSnackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={dismissSnackbar}
        />
      )}
    </>
  )
}
