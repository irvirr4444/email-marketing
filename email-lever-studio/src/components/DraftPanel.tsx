import { useState } from 'react'
import type { EmailDraft } from '../types'
import { DraftSkeleton, ThinkingMessage } from './LoadingShimmer'

type DraftPanelProps = {
  draft: EmailDraft | null
  loading: boolean
  draftVersion: number
  onChange: (draft: EmailDraft) => void
}

export function DraftPanel({
  draft,
  loading,
  draftVersion,
  onChange,
}: DraftPanelProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!draft) return
    const parts = [`Subject: ${draft.subject}`]
    if (draft.preheader?.trim()) parts.push(`Preheader: ${draft.preheader}`)
    parts.push('', draft.body)
    await navigator.clipboard.writeText(parts.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (!draft && !loading) {
    return (
      <section className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-[#e5e3de] bg-white/40 p-8">
        <p className="text-center text-[13px] text-[#6b6960]">
          Your draft will appear here after you generate.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-semibold text-[#1a1a18]">Draft</h2>
        <p className="mt-1 text-[13px] text-[#6b6960]">
          Inbox preview — edit freely, then copy.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[#e5e3de] bg-white p-6 shadow-md">
          <ThinkingMessage message="Drafting your email…" />
          <DraftSkeleton />
        </div>
      ) : draft ? (
        <div
          key={draftVersion}
          className="draft-fade-in rounded-xl border border-[#e5e3de] bg-white p-6 shadow-md"
        >
          <div className="space-y-1 border-b border-[#e5e3de] pb-4">
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => onChange({ ...draft, subject: e.target.value })}
              className="w-full border-0 bg-transparent text-[18px] font-semibold text-[#1a1a18] focus:outline-none"
              placeholder="Subject line"
            />
            <input
              type="text"
              value={draft.preheader ?? ''}
              onChange={(e) =>
                onChange({
                  ...draft,
                  preheader: e.target.value || undefined,
                })
              }
              className="w-full border-0 bg-transparent text-[13px] text-[#6b6960] focus:outline-none"
              placeholder="Preheader (optional)"
            />
          </div>

          <textarea
            value={draft.body}
            onChange={(e) => onChange({ ...draft, body: e.target.value })}
            rows={18}
            className="mt-4 w-full resize-y border-0 bg-transparent font-serif text-[15px] leading-[1.65] text-[#1a1a18] focus:outline-none"
          />

          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#e5e3de] pt-4">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-[#e5e3de] bg-[#fafaf8] px-4 py-2 text-[13px] font-medium text-[#1a1a18] transition-all duration-150 hover:bg-white active:scale-[0.99]"
            >
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <p className="text-[13px] text-[#6b6960]">
              Generated using your lever settings. Adjust levers and regenerate
              anytime.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
