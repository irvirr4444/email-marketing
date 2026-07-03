import { Badge } from '@ui/components/base/badges/badges'
import {
  getVisibleVariableSections,
  type EmailVariableSnapshot,
} from '@shared/email-variables.ts'

type Props = {
  snapshot: EmailVariableSnapshot
}

export default function EmailVariables({ snapshot }: Props) {
  const sections = getVisibleVariableSections(snapshot)

  if (sections.length === 0) return null

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
            {section.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {section.items.map((item) => (
              <Badge
                key={`${section.id}-${item.key}`}
                color={item.primary ? 'brand' : 'gray'}
                size="sm"
              >
                <span className="opacity-80">{item.label}:</span>{' '}
                <span className="font-medium">{item.value}</span>
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
