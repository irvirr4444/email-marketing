import { useEffect, useState } from 'react'
import type { CardKey, LeverSuggestion } from '../types'
import { CARD_DEFINITIONS } from '../../shared/schema.ts'
import { Badge } from './Badge'
import { CardFields, getCardValues } from './CardFields'
import { IntentLeverControl } from './IntentLever'
import { LeverGroupCard } from './LeverGroupCard'
import { ThinkingMessage } from './LoadingShimmer'

type LeverPanelProps = {
  levers: LeverSuggestion
  segmentLabel: string
  canSuggest: boolean
  loadingLevers: boolean
  loadingDraft: boolean
  hasDraft: boolean
  onLeversChange: (levers: LeverSuggestion) => void
  onSuggestLevers: () => void
  onRegenerate: () => void
}

export function LeverPanel({
  levers,
  segmentLabel,
  canSuggest,
  loadingLevers,
  loadingDraft,
  hasDraft,
  onLeversChange,
  onSuggestLevers,
  onRegenerate,
}: LeverPanelProps) {
  const [flashCards, setFlashCards] = useState<Set<string>>(new Set())
  const disabled = loadingLevers || loadingDraft

  useEffect(() => {
    if (flashCards.size === 0) return
    const t = window.setTimeout(() => setFlashCards(new Set()), 600)
    return () => window.clearTimeout(t)
  }, [flashCards])

  function flashCard(key: string) {
    setFlashCards((prev) => new Set(prev).add(key))
  }

  function updateCard(
    cardKey: CardKey,
    updater: (card: LeverSuggestion[CardKey]) => LeverSuggestion[CardKey],
    userInitiated: boolean,
  ) {
    const updated = updater(levers[cardKey])
    const next = {
      ...levers,
      [cardKey]: {
        ...updated,
        locked: userInitiated ? true : updated.locked,
      },
    }
    onLeversChange(next)
    if (userInitiated) flashCard(cardKey)
  }

  const suggestDisabled = !canSuggest || disabled
  const suggestTitle = !canSuggest
    ? 'Fill in recipient name and email first'
    : undefined

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-[17px] font-semibold text-[#1a1a18]">Levers</h2>
        <p className="mt-1 text-[13px] text-[#6b6960]">
          Suggest levers to review AI choices, then generate. Locked levers stay
          fixed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{segmentLabel} · First Touch</Badge>
        <Badge>Campaign: Cold Outreach</Badge>
        <Badge>Email 1 · New Thread</Badge>
      </div>

      <button
        type="button"
        onClick={onSuggestLevers}
        disabled={suggestDisabled}
        title={suggestTitle}
        className="w-full rounded-lg border border-[#e5e3de] bg-white px-4 py-2.5 text-[15px] font-medium text-[#1a1a18] transition-all duration-150 ease-out hover:bg-[#fafaf8] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingLevers ? 'Suggesting…' : 'Suggest Levers'}
      </button>

      {loadingLevers && (
        <ThinkingMessage message="AI is filling unlocked levers…" />
      )}
      {loadingDraft && !loadingLevers && (
        <ThinkingMessage message="Writing your email…" />
      )}

      <div
        className={`space-y-4 ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <IntentLeverControl
          intent={levers.intent}
          disabled={disabled}
          onChange={(intent) => onLeversChange({ ...levers, intent })}
        />

        {CARD_DEFINITIONS.map((cardDef, index) => {
          const card = levers[cardDef.key]
          return (
            <LeverGroupCard
              key={cardDef.key}
              title={cardDef.label}
              reasoning={card.reasoning}
              locked={card.locked}
              flash={flashCards.has(cardDef.key)}
              staggerIndex={index + 1}
              disabled={disabled}
              onToggleLock={() =>
                onLeversChange({
                  ...levers,
                  [cardDef.key]: { ...card, locked: !card.locked },
                })
              }
            >
              <CardFields
                cardKey={cardDef.key}
                values={getCardValues(levers, cardDef.key)}
                ctaCopy={cardDef.key === 'cta' ? levers.cta.ctaCopy : undefined}
                disabled={disabled}
                onValuesChange={(values) =>
                  updateCard(
                    cardDef.key,
                    (c) => ({ ...c, values: values as never }),
                    true,
                  )
                }
                onCtaCopyChange={
                  cardDef.key === 'cta'
                    ? (copy) =>
                        updateCard(
                          'cta',
                          (c) => ({ ...c, ctaCopy: copy }),
                          true,
                        )
                    : undefined
                }
              />
            </LeverGroupCard>
          )
        })}
      </div>

      {hasDraft && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRegenerate}
            disabled={disabled}
            className="rounded-lg bg-[#4f46e5] px-5 py-2.5 text-[15px] font-medium text-white transition-all duration-150 ease-out hover:bg-[#4338ca] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingDraft ? 'Regenerating…' : 'Regenerate Email'}
          </button>
        </div>
      )}
    </section>
  )
}
