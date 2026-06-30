import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { CardKey, LeverSuggestion } from '../types'
import { CARD_DEFINITIONS } from '../types'
import { MaterialIcon } from './MaterialIcon'
import { getCardValues, StyleField } from './StyleField'
import { StyleGroupCard, type CardVariant } from './StyleGroupCard'

type StyleSectionProps = {
  levers: LeverSuggestion
  leversSuggested: boolean
  canSuggest: boolean
  loadingLevers: boolean
  loadingDraft: boolean
  onLeversChange: (levers: LeverSuggestion) => void
  onSuggestLevers: () => void
}

type StyleRowProps = {
  label: string
  columns?: 1 | 2
  children: ReactNode
}

const STYLE_CARD_KEYS: CardKey[] = [
  'subjectLine',
  'preheader',
  'sender',
  'body',
  'copyStrategy',
  'cta',
  'offer',
]

function StyleRow({ label, columns = 1, children }: StyleRowProps) {
  return (
    <div className="style-row">
      <p className="style-row-label">{label}</p>
      <div
        className={
          columns === 2
            ? 'grid grid-cols-1 items-start gap-3 md:grid-cols-2'
            : undefined
        }
      >
        {children}
      </div>
    </div>
  )
}

export function StyleSection({
  levers,
  leversSuggested,
  canSuggest,
  loadingLevers,
  loadingDraft,
  onLeversChange,
  onSuggestLevers,
}: StyleSectionProps) {
  const [settlingCards, setSettlingCards] = useState<Set<string>>(new Set())
  const [touchedCards, setTouchedCards] = useState<Set<CardKey>>(() => new Set())
  const wasSuggestedRef = useRef(leversSuggested)
  const disabled = loadingLevers || loadingDraft

  useEffect(() => {
    if (leversSuggested && !wasSuggestedRef.current) {
      setSettlingCards(new Set(STYLE_CARD_KEYS))
    }
    wasSuggestedRef.current = leversSuggested
  }, [leversSuggested])

  useEffect(() => {
    if (settlingCards.size === 0) return
    const t = window.setTimeout(() => setSettlingCards(new Set()), 240)
    return () => window.clearTimeout(t)
  }, [settlingCards])

  function flashCard(key: string) {
    setSettlingCards((prev) => new Set(prev).add(key))
  }

  function touchCard(cardKey: CardKey) {
    setTouchedCards((prev) => new Set(prev).add(cardKey))
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
        locked:
          userInitiated && leversSuggested ? true : updated.locked,
      },
    }
    onLeversChange(next)
    if (userInitiated) {
      touchCard(cardKey)
      flashCard(cardKey)
    }
  }

  function handleSuggest() {
    if (!canSuggest || disabled) return
    onSuggestLevers()
  }

  function renderCard(cardKey: CardKey, variant: CardVariant) {
    const cardDef = CARD_DEFINITIONS.find((c) => c.key === cardKey)!
    const card = levers[cardKey]
    const useStacked = cardKey === 'cta'
    const emphasizeSelection = leversSuggested || touchedCards.has(cardKey)

    return (
      <StyleGroupCard
        title={cardDef.label}
        reasoning={card.reasoning}
        locked={card.locked}
        highlightLocked={leversSuggested && card.locked}
        showReasoning={leversSuggested}
        showLock={leversSuggested}
        subdued={!leversSuggested}
        settling={settlingCards.has(cardKey)}
        disabled={disabled}
        variant={variant}
        onToggleLock={() =>
          onLeversChange({
            ...levers,
            [cardKey]: { ...card, locked: !card.locked },
          })
        }
      >
        <StyleField
          cardKey={cardKey}
          values={getCardValues(levers, cardKey)}
          ctaCopy={cardKey === 'cta' ? levers.cta.ctaCopy : undefined}
          disabled={disabled}
          layout={useStacked ? 'stacked' : 'inline'}
          emphasizeSelection={emphasizeSelection}
          onValuesChange={(values) =>
            updateCard(
              cardKey,
              (c) => ({ ...c, values: values as never }),
              true,
            )
          }
          onCtaCopyChange={
            cardKey === 'cta'
              ? (copy) =>
                  updateCard('cta', (c) => ({ ...c, ctaCopy: copy }), true)
              : undefined
          }
        />
      </StyleGroupCard>
    )
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="section-title">Style</h2>
          <p className="mt-1 text-[13px] text-[var(--on-surface-variant)]">
            Recommend styles for your context, then lock anything you want to
            keep.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSuggest}
          disabled={!canSuggest || disabled}
          className="recommend-styles-btn m-ripple inline-flex shrink-0 items-center gap-2.5 rounded-full px-5 py-3 text-[12px] font-bold uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MaterialIcon
            name="auto_awesome"
            size={20}
            className="shrink-0"
          />
          {loadingLevers
            ? 'Recommending…'
            : 'Recommend styles for this context'}
        </button>
      </div>

      <div
        className={`style-pipeline rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container)] p-3 md:p-4 ${loadingLevers || loadingDraft ? 'pointer-events-none opacity-60' : ''}`}
      >
        <StyleRow label="Inbox">
          {renderCard('subjectLine', 'primary')}
        </StyleRow>

        <StyleRow label="Preview" columns={2}>
          {renderCard('preheader', 'supporting')}
          {renderCard('sender', 'supporting')}
        </StyleRow>

        <StyleRow label="Message">
          {renderCard('body', 'primary')}
        </StyleRow>

        <StyleRow label="Persuasion">
          {renderCard('copyStrategy', 'supporting')}
        </StyleRow>

        <StyleRow label="Action" columns={2}>
          {renderCard('cta', 'supporting')}
          {renderCard('offer', 'supporting')}
        </StyleRow>
      </div>
    </section>
  )
}
