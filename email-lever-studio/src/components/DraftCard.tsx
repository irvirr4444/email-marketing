import { useEffect, useState } from 'react'
import type { EmailDraft } from '../types'
import { MaterialIcon } from './MaterialIcon'

type DraftCardProps = {
  draft: EmailDraft | null
  loading: boolean
  draftVersion: number
  onChange: (draft: EmailDraft) => void
}

function DraftSkeleton() {
  return (
    <div className="draft-skeleton" aria-hidden>
      <div className="draft-skeleton-bar wide" style={{ width: '90%' }} />
      <div className="draft-skeleton-bar" style={{ width: '70%' }} />
      <div className="draft-skeleton-bar body" style={{ width: '100%' }} />
      <div className="draft-skeleton-bar body" style={{ width: '95%' }} />
      <div className="draft-skeleton-bar body" style={{ width: '80%' }} />
    </div>
  )
}

export function DraftCard({
  draft,
  loading,
  draftVersion,
  onChange,
}: DraftCardProps) {
  const [copied, setCopied] = useState(false)
  const [displayVersion, setDisplayVersion] = useState(draftVersion)
  const [animClass, setAnimClass] = useState('')

  useEffect(() => {
    if (draftVersion === displayVersion) return
    setAnimClass('fade-through-out')
    const t1 = window.setTimeout(() => {
      setDisplayVersion(draftVersion)
      setAnimClass('fade-through-in')
    }, 150)
    const t2 = window.setTimeout(() => setAnimClass(''), 300)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [draftVersion, displayVersion])

  async function handleCopy() {
    if (!draft) return
    const parts = [`Subject: ${draft.subject}`]
    if (draft.preheader?.trim()) parts.push(`Preheader: ${draft.preheader}`)
    parts.push('', draft.body)
    await navigator.clipboard.writeText(parts.join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const cardClass =
    'card-primary relative overflow-hidden rounded-[20px] bg-[var(--surface-paper)] p-8'

  if (!draft && !loading) return null

  return (
    <section className="space-y-3">
      <div className={cardClass}>
        {loading && !draft && <DraftSkeleton />}

        {loading && draft && (
          <div className="absolute inset-x-8 top-8 z-10">
            <DraftSkeleton />
          </div>
        )}

        {draft && (
          <div
            key={displayVersion}
            className={`${animClass} ${loading ? 'opacity-40' : ''}`}
          >
            <div className="space-y-1 border-b border-[var(--outline-variant)] pb-4">
              <input
                type="text"
                value={draft.subject}
                onChange={(e) =>
                  onChange({ ...draft, subject: e.target.value })
                }
                className="w-full rounded border border-transparent px-1 py-0.5 text-[20px] font-medium text-[var(--on-surface)] focus:border-[var(--outline)] focus:outline-none"
                placeholder="Subject line"
              />
              {draft.preheader?.trim() && (
                <input
                  type="text"
                  value={draft.preheader}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      preheader: e.target.value || undefined,
                    })
                  }
                  className="w-full rounded border border-transparent px-1 py-0.5 text-[13px] text-[var(--on-surface-variant)] focus:border-[var(--outline)] focus:outline-none"
                />
              )}
            </div>

            <textarea
              value={draft.body}
              onChange={(e) => onChange({ ...draft, body: e.target.value })}
              rows={14}
              className="mt-4 w-full resize-y rounded border border-transparent bg-transparent px-1 py-0.5 font-serif text-[17px] leading-[1.7] text-[var(--on-surface)] focus:border-[var(--outline)] focus:outline-none"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--outline-variant)] pt-4">
              <p className="text-[12px] text-[var(--on-surface-variant)]">
                Reflects your current style settings below
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="m-ripple inline-flex items-center gap-1.5 text-[13px] font-medium"
                style={{ color: copied ? 'var(--success)' : 'var(--primary)' }}
              >
                <MaterialIcon name="content_copy" size={18} />
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
