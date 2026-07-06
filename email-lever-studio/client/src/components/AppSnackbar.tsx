import { useEffect } from 'react'
import { CheckCircle, XCircle } from '@untitledui/icons'
import { CloseButton } from '@ui/components/base/buttons/close-button'
import { cx } from '@ui/utils/cx'

export type SnackbarVariant = 'brand' | 'error'

type Props = {
  message: string
  variant: SnackbarVariant
  onDismiss: () => void
}

const VARIANT_STYLES: Record<
  SnackbarVariant,
  { root: string; icon: typeof CheckCircle }
> = {
  brand: {
    root: 'bg-brand-solid text-white shadow-lg ring-1 ring-brand-solid/30',
    icon: CheckCircle,
  },
  error: {
    root: 'bg-error-solid text-white shadow-lg ring-1 ring-error-solid/30',
    icon: XCircle,
  },
}

/** Bottom toast for success and error feedback. */
export default function AppSnackbar({ message, variant, onDismiss }: Props) {
  const { root, icon: Icon } = VARIANT_STYLES[variant]

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4500)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'fixed bottom-6 left-1/2 z-[60] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        root,
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <CloseButton
        size="xs"
        theme="dark"
        label="Dismiss notification"
        onPress={onDismiss}
      />
    </div>
  )
}
