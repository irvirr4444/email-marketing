import { useState } from 'react'
import type { ColdContext } from '../types'
import { COMPANY_SIZE_OPTIONS, SENIORITY_OPTIONS } from '../types'
import { labelForSegment } from '../../shared/schema.ts'
import { CountrySelect } from './CountrySelect'
import { LanguageSelect } from './LanguageSelect'
import { SegmentSelect } from './SegmentSelect'

type ColdContextPanelProps = {
  context: ColdContext
  collapsed: boolean
  loading: boolean
  onChange: (context: ColdContext) => void
  onSubmit: () => void
  onExpand: () => void
}

const inputClass =
  'w-full rounded-lg border border-[#e5e3de] bg-white px-3 py-2 text-[15px] shadow-sm placeholder:text-[#6b6960]/60 focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 transition-colors duration-150'

export function ColdContextPanel({
  context,
  collapsed,
  loading,
  onChange,
  onSubmit,
  onExpand,
}: ColdContextPanelProps) {
  const [optionalOpen, setOptionalOpen] = useState(true)

  if (collapsed) {
    const optional: string[] = []
    if (context.companyName) optional.push(context.companyName)
    if (context.industry) optional.push(context.industry)
    if (context.role) optional.push(context.role)
    if (context.country) optional.push(context.country)
    if (context.language) optional.push(context.language)

    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-[#1a1a18]">Context</h2>
          <button
            type="button"
            onClick={onExpand}
            className="text-[13px] font-medium text-[#4f46e5] transition-colors duration-150 hover:text-[#4338ca]"
          >
            Edit context
          </button>
        </div>
        <p className="text-[13px] text-[#6b6960]">
          Segment: {labelForSegment(context.segmentAtSend)} · First Touch
        </p>
        <div className="rounded-xl border border-[#e5e3de] bg-white p-4 text-[15px] space-y-2">
          <p>
            <span className="font-medium text-[#6b6960]">To: </span>
            {context.recipientName} &lt;{context.recipientEmail}&gt;
          </p>
          {optional.length > 0 && (
            <p>
              <span className="font-medium text-[#6b6960]">Known: </span>
              {optional.join(' · ')}
            </p>
          )}
          {context.notes?.trim() && (
            <p className="line-clamp-2 text-[#6b6960]">{context.notes}</p>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-semibold text-[#1a1a18]">Context</h2>
        <p className="mt-1 text-[13px] text-[#6b6960]">
          Cold prospect — only fill what you actually know.
        </p>
      </div>

      <SegmentSelect
        value={context.segmentAtSend}
        disabled={loading}
        onChange={(segmentAtSend) => onChange({ ...context, segmentAtSend })}
      />

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-[13px] font-semibold text-[#1a1a18]">
            Recipient name <span className="text-[#4f46e5]">*</span>
          </span>
          <input
            type="text"
            value={context.recipientName}
            onChange={(e) =>
              onChange({ ...context, recipientName: e.target.value })
            }
            placeholder="Jane Doe"
            className={inputClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-semibold text-[#1a1a18]">
            Recipient email <span className="text-[#4f46e5]">*</span>
          </span>
          <input
            type="email"
            value={context.recipientEmail}
            onChange={(e) =>
              onChange({ ...context, recipientEmail: e.target.value })
            }
            placeholder="jane@company.com"
            className={inputClass}
          />
        </label>
      </div>

      <div className="rounded-xl border border-[#e5e3de] bg-white/60">
        <button
          type="button"
          onClick={() => setOptionalOpen(!optionalOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-[13px] font-medium text-[#6b6960] transition-colors duration-150 hover:text-[#1a1a18]"
        >
          What do you know about them? (optional)
          <span className="text-[#6b6960]">{optionalOpen ? '−' : '+'}</span>
        </button>

        {optionalOpen && (
          <div className="space-y-3 border-t border-[#e5e3de] px-4 py-4">
            {(
              [
                ['companyName', 'Company'],
                ['industry', 'Industry'],
                ['role', 'Role'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-1">
                <span className="text-[13px] text-[#6b6960]">{label}</span>
                <input
                  type="text"
                  value={context[key] ?? ''}
                  onChange={(e) =>
                    onChange({ ...context, [key]: e.target.value })
                  }
                  className={inputClass}
                />
              </label>
            ))}

            <label className="block space-y-1">
              <span className="text-[13px] text-[#6b6960]">Seniority</span>
              <select
                value={context.seniority ?? ''}
                onChange={(e) =>
                  onChange({ ...context, seniority: e.target.value })
                }
                className={inputClass}
              >
                <option value="">—</option>
                {SENIORITY_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[13px] text-[#6b6960]">Company size</span>
              <select
                value={context.companySize ?? ''}
                onChange={(e) =>
                  onChange({ ...context, companySize: e.target.value })
                }
                className={inputClass}
              >
                <option value="">—</option>
                {COMPANY_SIZE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-[13px] text-[#6b6960]">Country</span>
              <CountrySelect
                value={context.country}
                disabled={loading}
                onChange={(country) => onChange({ ...context, country })}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[13px] text-[#6b6960]">Language</span>
              <LanguageSelect
                value={context.language}
                disabled={loading}
                onChange={(language) => onChange({ ...context, language })}
              />
            </label>
          </div>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-[#1a1a18]">Notes</span>
        <textarea
          value={context.notes ?? ''}
          onChange={(e) => onChange({ ...context, notes: e.target.value })}
          rows={4}
          placeholder="Why you're reaching out, LinkedIn post, mutual connection..."
          className={`${inputClass} resize-y`}
        />
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={
          loading ||
          !context.recipientName.trim() ||
          !context.recipientEmail.trim()
        }
        className="w-full rounded-lg bg-[#4f46e5] px-4 py-2.5 text-[15px] font-medium text-white transition-all duration-150 ease-out hover:bg-[#4338ca] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Generating…' : 'Generate Email'}
      </button>
    </section>
  )
}
