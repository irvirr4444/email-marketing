import { useState } from 'react'
import { suggestLevers, generateDraft } from './api'
import {
  cloneLeverSuggestion,
  emptyColdContext,
  type EmailDraft,
  type LeverSuggestion,
} from './types'
import { AppBar } from './components/AppBar'
import { DraftCard } from './components/DraftCard'
import { IntentChips } from './components/IntentChips'
import { RecipientSection } from './components/RecipientSection'
import { SegmentSelector } from './components/SegmentSelector'
import { StepRail } from './components/StepRail'
import { StyleSection } from './components/StyleSection'

export default function App() {
  const [context, setContext] = useState(emptyColdContext)
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

  function handlePrimaryAction() {
    if (draft) {
      handleRegenerate()
    } else {
      handleGenerateEmail()
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <StepRail />
      <AppBar
        loadingLevers={loadingLevers}
        loadingDraft={loadingDraft}
        canGenerate={canSuggest}
        hasDraft={draft !== null}
        onGenerate={handlePrimaryAction}
      />

      <main className="space-y-12 py-8 lg:pl-[7.5rem]">
        <div className="mx-auto max-w-7xl space-y-12 px-6">
          {error && (
            <div className="rounded-lg border border-[var(--error)]/30 bg-[color-mix(in_srgb,var(--error)_8%,transparent)] px-4 py-3 text-[13px] text-[var(--error)]">
              {error}
            </div>
          )}

          <div id="section-recipient" className="section-scroll-target">
            <RecipientSection
              context={context}
              disabled={loadingLevers || loadingDraft}
              onChange={setContext}
            />
          </div>

          {(draft || loadingDraft) && (
            <div id="section-draft" className="section-scroll-target">
              <DraftCard
                draft={draft}
                loading={loadingDraft}
                draftVersion={draftVersion}
                onChange={setDraft}
              />
            </div>
          )}

          <div id="section-relationship" className="section-scroll-target">
            <SegmentSelector
              value={context.segmentAtSend}
              disabled={loadingLevers || loadingDraft}
              onChange={(segment) =>
                setContext({ ...context, segmentAtSend: segment })
              }
            />
          </div>

          <div id="section-intent" className="section-scroll-target">
            <IntentChips
              intent={levers.intent}
              disabled={loadingLevers || loadingDraft}
              onChange={(intent) => setLevers({ ...levers, intent })}
            />
          </div>

          <div id="section-style" className="section-scroll-target">
            <StyleSection
              context={context}
              levers={levers}
              leversSuggested={leversSuggested}
              canSuggest={canSuggest}
              loadingLevers={loadingLevers}
              loadingDraft={loadingDraft}
              onContextChange={setContext}
              onLeversChange={setLevers}
              onSuggestLevers={handleSuggestLevers}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
