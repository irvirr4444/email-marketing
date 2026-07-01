import type { IntentLever } from '../types'
import { INTENT_OPTIONS } from '../types'
import { MaterialChip } from './MaterialChip'

type IntentChipsProps = {
  intent: IntentLever
  disabled?: boolean
  onChange: (intent: IntentLever) => void
}

export function IntentChips({ intent, disabled, onChange }: IntentChipsProps) {
  function updateValue(value: string) {
    onChange({
      ...intent,
      value: (intent.value === value ? '' : value) as IntentLever['value'],
    })
  }

  return (
    <section className="space-y-3">
      <h2 className="section-title">What&apos;s the goal of this email?</h2>

      <div className="flex flex-wrap gap-2">
        {INTENT_OPTIONS.map((opt) => (
          <MaterialChip
            key={opt.value}
            variant="filter"
            label={opt.label}
            selected={intent.value === opt.value}
            disabled={disabled}
            onClick={() => updateValue(opt.value)}
          />
        ))}
      </div>
    </section>
  )
}
