import { useEffect, useId, useRef, useState } from 'react'
import { MaterialIcon } from './MaterialIcon'

type OutlinedMenuFieldProps = {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  disabled?: boolean
}

export function OutlinedMenuField({
  label,
  value,
  options,
  onChange,
  disabled,
}: OutlinedMenuFieldProps) {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const displayValue = value || ''

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`m-outlined-field block w-full text-left ${displayValue ? 'has-value' : ''}`}
      >
        <span className="block w-full rounded-lg border border-[var(--outline)] px-3 pb-2 pt-5 text-[15px] text-[var(--on-surface)]">
          {displayValue || '\u00A0'}
        </span>
        <label htmlFor={id}>{label}</label>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]">
          <MaterialIcon name="arrow_drop_down" size={24} />
        </span>
      </button>

      {open && (
        <div className="elevation-2 absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg bg-[var(--surface)] py-1">
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="block w-full px-4 py-2.5 text-left text-[13px] text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-high)]"
          >
            —
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={`block w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-[var(--surface-container-high)] ${
                value === opt
                  ? 'bg-[var(--primary-container)] text-[var(--primary)]'
                  : 'text-[var(--on-surface)]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
