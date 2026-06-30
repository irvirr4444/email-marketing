import { MaterialIcon } from './MaterialIcon'

type MaterialChipProps = {
  label: string
  selected?: boolean
  variant?: 'choice' | 'filter' | 'assist'
  onClick?: () => void
  disabled?: boolean
  showCheck?: boolean
  trailingIcon?: string
  className?: string
}

export function MaterialChip({
  label,
  selected,
  variant = 'choice',
  onClick,
  disabled,
  showCheck,
  trailingIcon,
  className = '',
}: MaterialChipProps) {
  const isFilter = variant === 'filter'
  const height = isFilter ? 'h-10' : 'h-8'
  const showLeadingCheck = selected && showCheck === true

  let selectedClass =
    'border-transparent bg-[var(--primary-container)] text-[var(--primary)]'
  if (selected && variant === 'choice') {
    selectedClass =
      'border-transparent bg-[var(--secondary-container)] text-[var(--secondary)]'
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`m-ripple inline-flex items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors duration-150 ${height} ${
        selected
          ? selectedClass
          : 'border-[var(--outline-variant)] bg-[var(--surface-container)] text-[var(--on-surface)] hover:bg-[var(--surface-container-high)]'
      } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {showLeadingCheck && (
        <MaterialIcon name="check" size={16} className="text-[var(--primary)]" />
      )}
      {label}
      {trailingIcon && <MaterialIcon name={trailingIcon} size={18} />}
    </button>
  )
}
