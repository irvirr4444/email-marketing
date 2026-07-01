import { MaterialIcon } from './MaterialIcon'

type LockButtonProps = {
  locked: boolean
  onClick: () => void
  disabled?: boolean
  title?: string
}

export function LockButton({
  locked,
  onClick,
  disabled,
  title,
}: LockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title ?? (locked ? 'Unlock' : 'Lock')}
      className="m-ripple flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-container-high)] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ color: locked ? 'var(--tertiary)' : 'var(--on-surface-variant)' }}
    >
      <MaterialIcon
        name={locked ? 'lock' : 'lock_open'}
        filled={locked}
        size={18}
      />
    </button>
  )
}
