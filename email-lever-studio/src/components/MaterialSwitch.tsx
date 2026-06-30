type MaterialSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}

export function MaterialSwitch({
  checked,
  onChange,
  disabled,
  label,
  id,
}: MaterialSwitchProps) {
  return (
    <label
      htmlFor={id}
      className={`m-switch-wrap ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="m-switch m-ripple"
      >
        <span className="m-switch-thumb" aria-hidden />
      </button>
      {label && <span className="m-switch-label">{label}</span>}
    </label>
  )
}
