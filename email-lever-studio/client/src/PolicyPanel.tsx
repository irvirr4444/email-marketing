import { useState } from 'react'
import { BrainCircuit, ChevronDown } from 'lucide-react'
import { Badge } from '@ui/components/base/badges/badges'
import { Button } from '@ui/components/base/buttons/button'
import {
  fetchRecovery,
  trainOnLoggedData,
  type RecoveryResult,
  type TrainResult,
} from './lib/api'

const LEVER_LABELS: Record<string, string> = {
  framework: 'Framework',
  sp_specificity: 'Proof specificity',
  specificity: 'Specificity',
  persuasion: 'Persuasion',
  sp_type: 'Proof type',
  cta_type: 'CTA type',
}

export default function PolicyPanel() {
  const [expanded, setExpanded] = useState(false)
  const [training, setTraining] = useState(false)
  const [sampling, setSampling] = useState(false)
  const [trainResult, setTrainResult] = useState<TrainResult | null>(null)
  const [recovery, setRecovery] = useState<RecoveryResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrain = async () => {
    setTraining(true)
    setError(null)
    try {
      setTrainResult(await trainOnLoggedData())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed.')
    } finally {
      setTraining(false)
    }
  }

  const handleRecovery = async () => {
    setSampling(true)
    setError(null)
    try {
      setRecovery(await fetchRecovery())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sample the policy.')
    } finally {
      setSampling(false)
    }
  }

  const pv = trainResult?.policyValue

  return (
    <section className="mt-10 rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-primary_hover transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-4 h-4 text-fg-brand-primary" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Policy — the bandit that picks your levers
          </span>
        </div>
        <ChevronDown
          className="w-4 h-4 text-fg-quaternary transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {expanded && (
        <div className="px-6 pb-6 border-t border-secondary">
          <p className="text-sm text-tertiary leading-relaxed mt-4 mb-5 max-w-2xl">
            The lever strategy for each email is chosen by a contextual bandit trained on
            logged sends (recipe → send → outcome in Postgres). Retrain it here; the fresh
            policy goes live for the next generation.
          </p>

          <div className="flex gap-2 flex-wrap mb-5">
            <Button
              size="sm"
              isLoading={training}
              isDisabled={training}
              onClick={() => void handleTrain()}
            >
              Train on logged data
            </Button>
            <Button
              size="sm"
              color="secondary"
              isLoading={sampling}
              isDisabled={sampling}
              onClick={() => void handleRecovery()}
            >
              What it learned
            </Button>
          </div>

          {error && <p className="text-sm text-error-primary mb-4">{error}</p>}

          {trainResult && (
            <div className="mb-5">
              <p className="text-sm text-tertiary mb-3">
                Trained on <b className="text-primary">{trainResult.loaded}</b> logged
                sends over <b className="text-primary">{trainResult.epochs}</b> epochs
                {pv ? ` · ${pv.distinctRecipes} distinct recipes` : ''}
              </p>
              {pv && (
                <div className="rounded-xl bg-primary ring-1 ring-secondary_alt divide-y divide-secondary">
                  <StatRow label="Logged baseline reward" value={pv.baseline.toFixed(3)} />
                  <StatRow label="Random pick from candidates" value={pv.random.toFixed(3)} />
                  <StatRow label="Greedy policy pick" value={pv.greedy.toFixed(3)} />
                  <StatRow
                    label="Lift over random"
                    value={`${pv.lift >= 0 ? '+' : ''}${pv.lift.toFixed(3)}`}
                    badge={pv.learned ? 'LEARNED' : 'no clear gain'}
                    badgeGood={pv.learned}
                  />
                </div>
              )}
              {trainResult.curve.length > 0 && (
                <p className="text-xs text-tertiary mt-3 leading-relaxed">
                  Reward curve —{' '}
                  {trainResult.curve
                    .map((p) => `${p.step}: ${p.avgReward.toFixed(3)}`)
                    .join(' · ')}
                </p>
              )}
            </div>
          )}

          {recovery && (
            <div>
              <p className="text-sm text-tertiary mb-3">
                Top lever values the greedy policy exploits toward ({recovery.trials}{' '}
                trials):
              </p>
              <div className="rounded-xl bg-primary ring-1 ring-secondary_alt divide-y divide-secondary">
                {Object.entries(recovery.top).map(([lever, top]) => (
                  <StatRow
                    key={lever}
                    label={LEVER_LABELS[lever] ?? lever}
                    value={top.map(([v, c]) => `${v} (${c})`).join(', ')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function StatRow({
  label,
  value,
  badge,
  badgeGood,
}: {
  label: string
  value: string
  badge?: string
  badgeGood?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <span className="text-sm text-tertiary">{label}</span>
      <span className="text-sm font-medium text-primary text-right">
        {value}
        {badge && (
          <span className="ml-2 inline-flex">
            <Badge color={badgeGood ? 'success' : 'gray'} size="sm">
              {badge}
            </Badge>
          </span>
        )}
      </span>
    </div>
  )
}
