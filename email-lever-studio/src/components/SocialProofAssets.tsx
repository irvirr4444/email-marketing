import type { ColdContext } from '../types'

type SocialProofAssetsProps = {
  context: ColdContext
  disabled?: boolean
  onChange: (context: ColdContext) => void
}

const fieldClass =
  'w-full rounded-lg border border-[var(--outline)] bg-[var(--surface)] px-3 py-2.5 text-[15px] text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'

export function SocialProofAssets({
  context,
  disabled,
  onChange,
}: SocialProofAssetsProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[14px] font-medium text-[var(--on-surface)]">
          Social proof you can use
        </h3>
        <p className="mt-1 text-[13px] text-[var(--on-surface-variant)]">
          Only fill in what you actually have. If a field is empty, the AI will
          skip that proof type.
        </p>
      </div>

      <div className="card-supporting space-y-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="recognizable-customer"
              className="mb-1.5 block text-[12px] font-medium text-[var(--on-surface-variant)]"
            >
              A customer they&apos;d recognize
            </label>
            <input
              type="text"
              id="recognizable-customer"
              value={context.socialProofAssets?.recognizableCustomer ?? ''}
              disabled={disabled}
              placeholder="e.g. Stripe, or a fintech startup like theirs"
              onChange={(e) =>
                onChange({
                  ...context,
                  socialProofAssets: {
                    ...context.socialProofAssets,
                    recognizableCustomer: e.target.value,
                  },
                })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="specific-result"
              className="mb-1.5 block text-[12px] font-medium text-[var(--on-surface-variant)]"
            >
              A specific result you can name
            </label>
            <input
              type="text"
              id="specific-result"
              value={context.socialProofAssets?.specificResult ?? ''}
              disabled={disabled}
              placeholder="e.g. Acme went from 2% to 8% reply rate in 6 weeks"
              onChange={(e) =>
                onChange({
                  ...context,
                  socialProofAssets: {
                    ...context.socialProofAssets,
                    specificResult: e.target.value,
                  },
                })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="customer-count"
              className="mb-1.5 block text-[12px] font-medium text-[var(--on-surface-variant)]"
            >
              How many customers or users
            </label>
            <input
              type="text"
              id="customer-count"
              value={context.socialProofAssets?.customerCount ?? ''}
              disabled={disabled}
              placeholder="e.g. 500 teams, 10,000+ users"
              onChange={(e) =>
                onChange({
                  ...context,
                  socialProofAssets: {
                    ...context.socialProofAssets,
                    customerCount: e.target.value,
                  },
                })
              }
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="recent-win"
              className="mb-1.5 block text-[12px] font-medium text-[var(--on-surface-variant)]"
            >
              Anything recent
            </label>
            <input
              type="text"
              id="recent-win"
              value={context.socialProofAssets?.recentWin ?? ''}
              disabled={disabled}
              placeholder="e.g. just signed a team at Salesforce last week"
              onChange={(e) =>
                onChange({
                  ...context,
                  socialProofAssets: {
                    ...context.socialProofAssets,
                    recentWin: e.target.value,
                  },
                })
              }
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="customer-quote"
            className="mb-1.5 block text-[12px] font-medium text-[var(--on-surface-variant)]"
          >
            A real quote from a customer
          </label>
          <textarea
            id="customer-quote"
            value={context.socialProofAssets?.customerQuote ?? ''}
            disabled={disabled}
            placeholder="Name, role, company — what they said"
            rows={4}
            onChange={(e) =>
              onChange({
                ...context,
                socialProofAssets: {
                  ...context.socialProofAssets,
                  customerQuote: e.target.value,
                },
              })
            }
            className={`${fieldClass} resize-y py-3`}
          />
        </div>
      </div>
    </div>
  )
}
