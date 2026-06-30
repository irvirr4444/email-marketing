import type { ColdContext } from '../types'
import { COMPANY_SIZE_OPTIONS, SENIORITY_OPTIONS } from '../types'
import { CountryField } from './CountryField'
import { LanguageField } from './LanguageField'
import { OutlinedMenuField } from './OutlinedMenuField'

type ContextDetailsProps = {
  context: ColdContext
  disabled?: boolean
  onChange: (context: ColdContext) => void
}

export function ContextDetails({
  context,
  disabled,
  onChange,
}: ContextDetailsProps) {
  return (
    <div className="space-y-4 pt-4">
      <p className="text-[13px] text-[var(--on-surface-variant)]">
        Add anything you actually know about them — the rest stays unset.
      </p>

      <div className="grid grid-cols-1 gap-4 min-[600px]:grid-cols-2">
        <div className="m-outlined-field">
          <input
            type="text"
            id="company"
            value={context.companyName ?? ''}
            disabled={disabled}
            placeholder=" "
            onChange={(e) =>
              onChange({ ...context, companyName: e.target.value })
            }
          />
          <label htmlFor="company">Company</label>
        </div>

        <div className="m-outlined-field">
          <input
            type="text"
            id="industry"
            value={context.industry ?? ''}
            disabled={disabled}
            placeholder=" "
            onChange={(e) =>
              onChange({ ...context, industry: e.target.value })
            }
          />
          <label htmlFor="industry">Industry</label>
        </div>

        <div className="m-outlined-field">
          <input
            type="text"
            id="role"
            value={context.role ?? ''}
            disabled={disabled}
            placeholder=" "
            onChange={(e) => onChange({ ...context, role: e.target.value })}
          />
          <label htmlFor="role">Role</label>
        </div>

        <OutlinedMenuField
          label="Seniority"
          value={context.seniority ?? ''}
          options={SENIORITY_OPTIONS}
          disabled={disabled}
          onChange={(v) => onChange({ ...context, seniority: v || undefined })}
        />

        <OutlinedMenuField
          label="Company size"
          value={context.companySize ?? ''}
          options={COMPANY_SIZE_OPTIONS}
          disabled={disabled}
          onChange={(v) => onChange({ ...context, companySize: v || undefined })}
        />

        <CountryField
          value={context.country}
          disabled={disabled}
          onChange={(country) => onChange({ ...context, country })}
        />

        <LanguageField
          value={context.language}
          disabled={disabled}
          onChange={(language) => onChange({ ...context, language })}
        />
      </div>

      <div>
        <span className="mb-1.5 block text-[12px] font-medium text-[var(--on-surface-variant)]">
          Notes
        </span>
        <textarea
          id="notes"
          value={context.notes ?? ''}
          disabled={disabled}
          placeholder="Why are you reaching out? Anything they've posted or said recently?"
          rows={4}
          onChange={(e) => onChange({ ...context, notes: e.target.value })}
          className="w-full rounded-lg border border-[var(--outline)] px-3 py-3 text-[15px] text-[var(--on-surface)] focus:border-[var(--primary)] focus:outline-none"
        />
      </div>
    </div>
  )
}
