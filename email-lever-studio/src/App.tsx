import { useState } from 'react'
import { suggestLevers, generateDraft } from './api'
import {
  cloneLeverSuggestion,
  emptyColdContext,
  labelForSegment,
  type EmailDraft,
  type LeverSuggestion,
} from './types'
import { ColdContextPanel } from './components/ColdContextPanel'
import { LeverPanel } from './components/LeverPanel'
import { DraftPanel } from './components/DraftPanel'

export default function App() {
  const [context, setContext] = useState(emptyColdContext)
  const [contextCollapsed, setContextCollapsed] = useState(false)
  const [levers, setLevers] = useState<LeverSuggestion>(() =>
    cloneLeverSuggestion(),
  )
  const [leversSuggested, setLeversSuggested] = useState(false)
  const [draft, setDraft] = useState<EmailDraft | null>(null)
  const [loadingLevers, setLoadingLevers] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [draftVersion, setDraftVersion] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const canSuggest = Boolean(
    context.recipientName.trim() && context.recipientEmail.trim(),
  )

  async function runSuggestLevers(): Promise<LeverSuggestion> {
    const suggested = await suggestLevers(context, levers)
    setLevers(suggested)
    setLeversSuggested(true)
    return suggested
  }

  async function handleSuggestLevers() {
    if (!canSuggest) return
    setError(null)
    setLoadingLevers(true)
    try {
      await runSuggestLevers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoadingLevers(false)
    }
  }

  async function handleGenerateEmail() {
    if (!canSuggest) return
    setError(null)

    if (!leversSuggested) {
      setLoadingLevers(true)
      setDraft(null)
      try {
        const suggested = await runSuggestLevers()
        setContextCollapsed(true)
        setLoadingLevers(false)
        setLoadingDraft(true)
        const result = await generateDraft(context, suggested)
        setDraft(result)
        setDraftVersion((v) => v + 1)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoadingLevers(false)
        setLoadingDraft(false)
      }
      return
    }

    setLoadingDraft(true)
    try {
      setContextCollapsed(true)
      const result = await generateDraft(context, levers)
      setDraft(result)
      setDraftVersion((v) => v + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoadingDraft(false)
    }
  }

  async function handleRegenerate() {
    setError(null)
    setLoadingDraft(true)

    try {
      const result = await generateDraft(context, levers)
      setDraft(result)
      setDraftVersion((v) => v + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoadingDraft(false)
    }
  }

  const busy = loadingLevers || loadingDraft

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-[#e5e3de] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <span className="text-[22px] font-semibold tracking-tight text-[#4f46e5]">
            Lever
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-3">
            <ColdContextPanel
              context={context}
              collapsed={contextCollapsed}
              loading={busy}
              onChange={setContext}
              onSubmit={handleGenerateEmail}
              onExpand={() => setContextCollapsed(false)}
            />
          </div>

          <div className="lg:col-span-4">
            <LeverPanel
              levers={levers}
              segmentLabel={labelForSegment(context.segmentAtSend)}
              canSuggest={canSuggest}
              loadingLevers={loadingLevers}
              loadingDraft={loadingDraft}
              hasDraft={draft !== null}
              onLeversChange={setLevers}
              onSuggestLevers={handleSuggestLevers}
              onRegenerate={handleRegenerate}
            />
          </div>

          <div className="lg:col-span-5">
            <DraftPanel
              draft={draft}
              loading={loadingDraft}
              draftVersion={draftVersion}
              onChange={setDraft}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
