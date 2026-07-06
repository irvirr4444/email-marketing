import {
  getVisibleVariableSections,
  type EmailVariableSnapshot,
} from '@shared/email-variables.ts'
import VariableHelpIcon from './variable-help/VariableHelpIcon'
import VariableValueBadge from './variable-help/VariableValueBadge'
import {
  resolveVariableHelp,
  resolveVariableValueMeaning,
} from './variable-help/resolveVariableMetadata'

type Props = {
  snapshot: EmailVariableSnapshot
}

export default function EmailVariables({ snapshot }: Props) {
  const sections = getVisibleVariableSections(snapshot)

  if (sections.length === 0) return null

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
      {sections.map((section) => (
        <section
          key={section.id}
          className="border-l-2 border-brand-solid pl-4"
        >
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
            {section.label}
          </h3>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li
                key={`${section.id}-${item.key}`}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="text-sm font-medium text-secondary">
                    {item.label}
                  </span>
                  <VariableHelpIcon
                    label={item.label}
                    help={resolveVariableHelp(item.key)}
                  />
                </div>
                <VariableValueBadge
                  value={item.value}
                  meaning={resolveVariableValueMeaning(
                    item.key,
                    snapshot,
                    item.value,
                  )}
                  primary={item.primary}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
