import { useState } from 'react'
import { BrainCircuit, ChevronDown, Loader2 } from 'lucide-react'
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
    <section className="mt-10 bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.06)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-7 py-4 text-left hover:bg-secondary/60 transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          <BrainCircuit className="w-4 h-4 text-primary" />
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-foreground">
            Policy — the bandit that picks your levers
          </span>
        </div>
        <ChevronDown
          className="w-4 h-4 text-muted-foreground transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {expanded && (
        <div className="px-7 pb-7 border-t border-border">
          <p className="text-xs text-muted-foreground leading-relaxed mt-4 mb-5 max-w-[620px]">
            The lever strategy for each email is chosen by a contextual bandit trained on
            logged sends (recipe → send → outcome in Postgres). Retrain it here; the fresh
            policy goes live for the next generation.
          </p>

          <div className="flex gap-2 flex-wrap mb-5">
            <button
              onClick={() => void handleTrain()}
              disabled={training}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {training && <Loader2 className="w-3 h-3 animate-spin" />}
              {training ? 'Training…' : 'Train on logged data'}
            </button>
            <button
              onClick={() => void handleRecovery()}
              disabled={sampling}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-border bg-background hover:bg-secondary transition-all duration-150 text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sampling && <Loader2 className="w-3 h-3 animate-spin" />}
              {sampling ? 'Sampling…' : 'What it learned'}
            </button>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {trainResult && (
            <div className="mb-5">
              <p className="text-xs text-muted-foreground mb-3">
                Trained on <b className="text-foreground">{trainResult.loaded}</b> logged
                sends over <b className="text-foreground">{trainResult.epochs}</b> epochs
                {pv ? ` · ${pv.distinctRecipes} distinct recipes` : ''}
              </p>
              {pv && (
                <div className="border border-border rounded-xl bg-background divide-y divide-border">
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
                <p className="text-[0.6875rem] text-muted-foreground mt-3 leading-relaxed">
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
              <p className="text-xs text-muted-foreground mb-3">
                Top lever values the greedy policy exploits toward ({recovery.trials}{' '}
                trials):
              </p>
              <div className="border border-border rounded-xl bg-background divide-y divide-border">
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
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground text-right">
        {value}
        {badge && (
          <b
            className="ml-2 text-[0.6875rem]"
            style={{ color: badgeGood ? 'var(--primary)' : 'var(--muted-foreground)' }}
          >
            {badge}
          </b>
        )}
      </span>
    </div>
  )
}
