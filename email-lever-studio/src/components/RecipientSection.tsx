import type { ColdContext } from '../types'
import { ContextDetails } from './ContextDetails'

type RecipientSectionProps = {
  context: ColdContext
  disabled?: boolean
  onChange: (context: ColdContext) => void
}

export function RecipientSection({
  context,
  disabled,
  onChange,
}: RecipientSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="section-title">Who you&apos;re writing to</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="m-outlined-field">
          <input
            type="text"
            id="recipient-name"
            value={context.recipientName}
            disabled={disabled}
            placeholder=" "
            onChange={(e) =>
              onChange({ ...context, recipientName: e.target.value })
            }
          />
          <label htmlFor="recipient-name">Recipient name</label>
        </div>

        <div className="m-outlined-field">
          <input
            type="email"
            id="recipient-email"
            value={context.recipientEmail}
            disabled={disabled}
            placeholder=" "
            onChange={(e) =>
              onChange({ ...context, recipientEmail: e.target.value })
            }
          />
          <label htmlFor="recipient-email">Recipient email</label>
        </div>
      </div>

      <ContextDetails
        context={context}
        disabled={disabled}
        onChange={onChange}
      />
    </section>
  )
}
