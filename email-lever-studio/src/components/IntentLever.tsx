import { useEffect, useState } from 'react'
import type { IntentLever } from '../types'
import { INTENT_OPTIONS } from '../types'
import { LockIcon } from './LockIcon'
import { SegmentedControl } from './SegmentedControl'

type IntentLeverProps = {
  intent: IntentLever
  onChange: (intent: IntentLever) => void
  disabled?: boolean
}

export function IntentLeverControl({
  intent,
  onChange,
  disabled,
}: IntentLeverProps) {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(false), 600)
    return () => window.clearTimeout(t)
  }, [flash])

  function updateValue(value: string, userInitiated: boolean) {
    onChange({
      ...intent,
      value: value as IntentLever['value'],
      locked: userInitiated ? true : intent.locked,
    })
    if (userInitiated) setFlash(true)
  }

  return (
    <div
      className={`fade-in rounded-xl border bg-white p-5 transition-all duration-150 ${
        flash ? 'lock-flash border-[#4f46e5]/40' : 'border-[#e5e3de]'
      } ${intent.locked ? 'ring-1 ring-[#4f46e5]/20' : ''}`}
      style={{ opacity: 0 }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1a1a18]">Intent</h3>
          <p className="mt-1 text-[13px] italic text-[#6b6960]">
            AI: {intent.reasoning}
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...intent, locked: !intent.locked })}
          className={`rounded-md p-1.5 transition-colors duration-150 disabled:opacity-50 ${
            intent.locked
              ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
              : 'text-[#6b6960] hover:bg-[#fafaf8]'
          }`}
        >
          <LockIcon locked={intent.locked} className="h-4 w-4" />
        </button>
      </div>
      <SegmentedControl
        options={INTENT_OPTIONS}
        value={intent.value}
        disabled={disabled}
        onChange={(v) => updateValue(v, true)}
      />
    </div>
  )
}
