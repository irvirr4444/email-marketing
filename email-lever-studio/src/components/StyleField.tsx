import type { CardKey, FieldDef, LeverSuggestion } from '../../shared/schema.ts'
import { CARD_DEFINITIONS } from '../../shared/schema.ts'
import { MaterialChip } from './MaterialChip'
import { MaterialSwitch } from './MaterialSwitch'

type StyleFieldProps = {
  cardKey: CardKey
  values: Record<string, unknown>
  ctaCopy?: string
  onValuesChange: (values: Record<string, unknown>) => void
  onCtaCopyChange?: (copy: string) => void
  onFieldInteraction?: (fieldKey: string) => void
  disabled?: boolean
  layout?: 'inline' | 'stacked'
  isFieldEmphasized?: (fieldKey: string) => boolean
}

function isFieldInactive(
  field: FieldDef,
  values: Record<string, unknown>,
): boolean {
  if (!field.hiddenWhen) return false
  const parentVal = values[field.hiddenWhen.field]
  if (parentVal === field.hiddenWhen.equals) return true
  // Deselected segmented chips use ''; treat as inactive when parent is 'none'
  if (parentVal === '' && field.hiddenWhen.equals === 'none') return true
  return false
}

type FieldGroup = FieldDef | FieldDef[]

function groupFields(fields: FieldDef[]): FieldGroup[] {
  const groups: FieldGroup[] = []
  let toggleBatch: FieldDef[] = []

  function flushToggles() {
    if (toggleBatch.length === 0) return
    groups.push([...toggleBatch])
    toggleBatch = []
  }

  for (const field of fields) {
    if (field.type === 'toggle') {
      toggleBatch.push(field)
    } else {
      flushToggles()
      groups.push(field)
    }
  }
  flushToggles()
  return groups
}

function rowClass(fullWidth: boolean) {
  return `style-field-row${fullWidth ? ' col-span-full' : ''}`
}

const CTA_COPY_PLACEHOLDER = 'Would you be open to a quick reply?'

export function StyleField({
  cardKey,
  values,
  ctaCopy,
  onValuesChange,
  onCtaCopyChange,
  onFieldInteraction,
  disabled,
  layout = 'inline',
  isFieldEmphasized = () => true,
}: StyleFieldProps) {
  const card = CARD_DEFINITIONS.find((c) => c.key === cardKey)
  if (!card) return null

  function setFieldValue(key: string, val: unknown) {
    onFieldInteraction?.(key)
    onValuesChange({ ...values, [key]: val })
  }

  const groups = groupFields(card.fields)
  const isStacked = layout === 'stacked'
  const useMicroLabels = isStacked || cardKey === 'copyStrategy'
  const useFieldGrid =
    cardKey === 'subjectLine' || cardKey === 'body' || cardKey === 'copyStrategy'
  const fieldsClass = useFieldGrid
    ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2'
    : 'flex flex-col gap-2'

  return (
    <div className={fieldsClass}>
      {groups.map((group) => {
        if (Array.isArray(group)) {
          const fullWidth = useFieldGrid
          return (
            <div
              key={group.map((f) => f.key).join('-')}
              className={rowClass(fullWidth)}
            >
              <div className="style-field-controls">
                {group.map((field) => {
                  const showToggle = isFieldEmphasized(field.key)
                  return (
                    <div
                      key={field.key}
                      className="flex items-center gap-2 text-[12px] text-[var(--on-surface-variant)]"
                    >
                      <span className="font-medium">{field.label}</span>
                      <MaterialSwitch
                        checked={
                          showToggle
                            ? Boolean(values[field.key])
                            : false
                        }
                        disabled={disabled}
                        onChange={(v) => setFieldValue(field.key, v)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        const field = group
        const isSegmented = field.type === 'segmented'
        const fieldInactive = isFieldInactive(field, values)
        const showChoice = isFieldEmphasized(field.key)

        return (
          <div
            key={field.key}
            className={`${rowClass(false)}${fieldInactive ? ' style-field-row-inactive' : ''}`}
          >
            {isSegmented && field.type === 'segmented' && (
              <div
                className={
                  isStacked
                    ? 'flex flex-col gap-2'
                    : 'flex flex-wrap items-center gap-x-3 gap-y-2'
                }
              >
                <span
                  className={
                    useMicroLabels
                      ? 'field-micro-label block'
                      : 'style-field-label'
                  }
                >
                  {field.label}
                </span>
                <div className="style-field-controls">
                  {field.options.map((opt) => (
                    <MaterialChip
                      key={opt.value}
                      variant="choice"
                      label={opt.label}
                      selected={
                        showChoice &&
                        String(values[field.key] ?? '') === opt.value
                      }
                      disabled={disabled || fieldInactive}
                      onClick={() => {
                        const current = String(values[field.key] ?? '')
                        if (showChoice && current === opt.value) {
                          setFieldValue(field.key, '')
                        } else {
                          setFieldValue(field.key, opt.value)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {field.type === 'text' && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="style-field-label">{field.label}</span>
                <input
                  type="text"
                  value={String(values[field.key] ?? '')}
                  disabled={disabled || fieldInactive}
                  onChange={(e) => setFieldValue(field.key, e.target.value)}
                  placeholder="e.g. 20%"
                  className="w-full max-w-[140px] rounded-lg border border-[var(--outline)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] focus:border-[var(--primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}
          </div>
        )
      })}

      {cardKey === 'cta' && onCtaCopyChange && (
        <div className={`${rowClass(useFieldGrid)} border-t border-[var(--outline-variant)] !bg-transparent`}>
          <span className="field-micro-label mb-2 block">CTA copy</span>
          <input
            type="text"
            value={
              isFieldEmphasized('ctaCopy') ? (ctaCopy ?? '') : ''
            }
            disabled={disabled}
            placeholder={CTA_COPY_PLACEHOLDER}
            onChange={(e) => {
              onFieldInteraction?.('ctaCopy')
              onCtaCopyChange(e.target.value)
            }}
            className="w-full rounded-lg border border-[var(--outline)] bg-[var(--surface)] px-3 py-2 text-[13px] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>
      )}
    </div>
  )
}

export function getCardValues(
  levers: LeverSuggestion,
  cardKey: CardKey,
): Record<string, unknown> {
  const card = levers[cardKey]
  return { ...card.values } as Record<string, unknown>
}
