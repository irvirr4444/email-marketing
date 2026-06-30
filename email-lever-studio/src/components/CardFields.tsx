import type { CardKey, FieldDef, LeverSuggestion } from '../../shared/schema.ts'
import { CARD_DEFINITIONS } from '../../shared/schema.ts'
import { SegmentedControl } from './SegmentedControl'
import { ToggleSwitch } from './ToggleSwitch'

type CardFieldsProps = {
  cardKey: CardKey
  values: Record<string, unknown>
  ctaCopy?: string
  onValuesChange: (values: Record<string, unknown>) => void
  onCtaCopyChange?: (copy: string) => void
  disabled?: boolean
}

function isFieldVisible(
  field: FieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.hiddenWhen) return true
  return values[field.hiddenWhen.field] !== field.hiddenWhen.equals
}

export function CardFields({
  cardKey,
  values,
  ctaCopy,
  onValuesChange,
  onCtaCopyChange,
  disabled,
}: CardFieldsProps) {
  const card = CARD_DEFINITIONS.find((c) => c.key === cardKey)
  if (!card) return null

  function setValue(key: string, val: unknown) {
    onValuesChange({ ...values, [key]: val })
  }

  return (
    <>
      {card.fields.map((field) => {
        if (!isFieldVisible(field, values)) return null

        return (
          <div
            key={field.key}
            className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <span className="shrink-0 text-[13px] font-medium text-[#6b6960]">
              {field.label}
            </span>
            <div className="min-w-0">
              {field.type === 'segmented' && (
                <SegmentedControl
                  compact
                  options={field.options}
                  value={String(values[field.key] ?? '')}
                  disabled={disabled}
                  onChange={(v) => setValue(field.key, v)}
                />
              )}
              {field.type === 'toggle' && (
                <ToggleSwitch
                  label={field.label}
                  checked={Boolean(values[field.key])}
                  disabled={disabled}
                  onChange={(v) => setValue(field.key, v)}
                />
              )}
              {field.type === 'text' && (
                <input
                  type="text"
                  value={String(values[field.key] ?? '')}
                  disabled={disabled}
                  onChange={(e) => setValue(field.key, e.target.value)}
                  placeholder="e.g. 20%"
                  className="w-full rounded-lg border border-[#e5e3de] bg-[#fafaf8] px-2.5 py-1.5 text-[13px] focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 sm:w-40"
                />
              )}
            </div>
          </div>
        )
      })}
      {cardKey === 'cta' && onCtaCopyChange && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="shrink-0 text-[13px] font-medium text-[#6b6960]">
            CTA copy
          </span>
          <input
            type="text"
            value={ctaCopy ?? ''}
            disabled={disabled}
            onChange={(e) => onCtaCopyChange(e.target.value)}
            className="w-full rounded-lg border border-[#e5e3de] bg-[#fafaf8] px-2.5 py-1.5 text-[13px] focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 sm:max-w-xs"
          />
        </div>
      )}
    </>
  )
}

export function getCardValues(
  levers: LeverSuggestion,
  cardKey: CardKey,
): Record<string, unknown> {
  const card = levers[cardKey]
  return { ...card.values } as Record<string, unknown>
}
