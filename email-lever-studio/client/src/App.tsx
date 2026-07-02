import { useState, useMemo, useRef, useEffect } from 'react'
import { Check, Copy, ChevronDown, Loader2, ArrowRight, Zap } from 'lucide-react'
import { generateEmail } from './lib/api'
import {
  buildLeverChips,
  buildProofFacts,
  buildStrategyCards,
  formatEmailForCopy,
  type LeverChip,
  type StrategyCard,
} from './lib/display'
import type { EmailDraft } from '../../../shared/schema.ts'

type AppState = 'idle' | 'generating' | 'success' | 'error'

const STEPS = [
  'Reading your pages',
  'Researching social proof',
  'Choosing email strategy',
  'Writing your email',
]

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [company, setCompany] = useState('')
  const [product, setProduct] = useState('')
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<number[]>([0])
  const [proofExpanded, setProofExpanded] = useState(false)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [draft, setDraft] = useState<EmailDraft | null>(null)
  const [leverChips, setLeverChips] = useState<LeverChip[]>([])
  const [strategyCards, setStrategyCards] = useState<StrategyCard[]>([])
  const [proofFacts, setProofFacts] = useState<string[]>([])

  const canGenerate = company.trim().length > 0 && product.trim().length > 0

  const handleGenerate = async () => {
    if (!canGenerate || appState === 'generating') return

    setAppState('generating')
    setErrorMessage(null)
    setCurrentStep(0)
    setCompletedSteps([])
    setResultsVisible(false)

    try {
      const result = await generateEmail(company, product, (step) => {
        setCurrentStep(step)
        if (step > 0) {
          setCompletedSteps((prev) =>
            prev.includes(step - 1) ? prev : [...prev, step - 1],
          )
        }
      })

      setCompletedSteps([0, 1, 2, 3])
      setDraft(result.draft)
      setLeverChips(buildLeverChips(result.levers, result.researchConfig, result.styleKey))
      setStrategyCards(buildStrategyCards(result.levers, result.researchConfig, result.styleKey))
      setProofFacts(buildProofFacts(result.proofAssets))

      setAppState('success')
      setTimeout(() => setResultsVisible(true), 60)
    } catch (err) {
      setAppState('error')
      setErrorMessage(
        err instanceof Error ? err.message : 'Something went wrong — try again.',
      )
    }
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const updateDraft = (patch: Partial<EmailDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const toggleCard = (i: number) => {
    setExpandedCards((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    )
  }

  const handleReset = () => {
    setResultsVisible(false)
    setTimeout(() => {
      setAppState('idle')
      setCompany('')
      setProduct('')
      setCurrentStep(-1)
      setCompletedSteps([])
      setDraft(null)
      setLeverChips([])
      setStrategyCards([])
      setProofFacts([])
      setErrorMessage(null)
    }, 200)
  }

  const showInputPanel = appState === 'idle' || appState === 'generating' || appState === 'error'

  return (
    <div className="min-h-screen bg-background py-16 px-5">
      <div className="max-w-[960px] mx-auto">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full bg-secondary border border-border">
            <Zap className="w-3 h-3 text-primary" fill="currentColor" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">
              Email Lever Studio
            </span>
          </div>
          <h1 className="text-[2.6rem] leading-[1.15] font-semibold text-foreground mb-4 tracking-tight">
            Paste your company and product —<br className="hidden sm:block" />
            <span className="text-primary"> get a research&#8209;backed</span> cold email
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground max-w-[460px] mx-auto leading-relaxed">
            In about 20 seconds. Grounded in real social proof, a clear persuasion
            strategy, and a subject line worth opening.
          </p>
        </header>

        {showInputPanel && (
          <section className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.06)] p-7 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleGenerate()}
                  placeholder="https://mycompany.com"
                  disabled={appState === 'generating'}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1.5 ml-0.5">
                  Name or website URL
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Product
                </label>
                <input
                  type="text"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleGenerate()}
                  placeholder="https://myproduct.com"
                  disabled={appState === 'generating'}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/40 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1.5 ml-0.5">
                  Name, description, or product page URL
                </p>
              </div>
            </div>

            {appState === 'error' && errorMessage && (
              <p className="text-sm text-destructive mb-4 text-center">{errorMessage}</p>
            )}

            <button
              onClick={() => void handleGenerate()}
              disabled={!canGenerate || appState === 'generating'}
              className="w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-150 active:scale-[0.985] flex items-center justify-center gap-2 select-none"
              style={{
                backgroundColor:
                  !canGenerate || appState === 'generating'
                    ? 'var(--muted)'
                    : 'var(--primary)',
                color:
                  !canGenerate || appState === 'generating'
                    ? 'var(--muted-foreground)'
                    : 'var(--primary-foreground)',
                cursor:
                  !canGenerate || appState === 'generating'
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {appState === 'generating' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  Generate Email
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </section>
        )}

        {appState === 'generating' && (
          <section className="mb-6">
            <div className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.06)] p-7 mb-4">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-5">
                In progress
              </p>
              <StepTracker
                steps={STEPS}
                currentStep={currentStep}
                completedSteps={completedSteps}
                layout="horizontal"
              />
              <StepTracker
                steps={STEPS}
                currentStep={currentStep}
                completedSteps={completedSteps}
                layout="vertical"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
              <SkeletonCard variant="email" />
              <SkeletonCard variant="strategy" />
            </div>
          </section>
        )}

        {appState === 'success' && draft && (
          <section
            className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 transition-all duration-500"
            style={{
              opacity: resultsVisible ? 1 : 0,
              transform: resultsVisible ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            <div className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.07)] p-7 flex flex-col">
              <div className="mb-5">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
                  Subject
                </p>
                <input
                  type="text"
                  value={draft.subject}
                  onChange={(e) => updateDraft({ subject: e.target.value })}
                  className="w-full text-lg font-semibold text-foreground leading-snug mb-2 bg-transparent border border-transparent hover:border-border focus:border-primary/40 focus:ring-2 focus:ring-ring/40 rounded-lg px-2 py-1 -mx-2 outline-none transition-all duration-150"
                  style={{ letterSpacing: '-0.01em' }}
                />
                {draft.preheader !== undefined && draft.preheader !== '' && (
                  <input
                    type="text"
                    value={draft.preheader}
                    onChange={(e) => updateDraft({ preheader: e.target.value })}
                    placeholder="Preheader (optional)"
                    className="w-full text-sm text-muted-foreground italic leading-relaxed bg-transparent border border-transparent hover:border-border focus:border-primary/40 focus:ring-2 focus:ring-ring/40 rounded-lg px-2 py-1 -mx-2 outline-none transition-all duration-150"
                  />
                )}
              </div>

              <div className="border-t border-border pt-5 flex-1">
                <EditableBody
                  value={draft.body}
                  onChange={(body) => updateDraft({ body })}
                />
              </div>

              <div className="flex gap-2 mt-6 pt-5 border-t border-border flex-wrap">
                <CopyButton
                  label="Copy subject"
                  copied={copiedField === 'subject'}
                  onClick={() => handleCopy(draft.subject, 'subject')}
                />
                <CopyButton
                  label="Copy email"
                  copied={copiedField === 'email'}
                  onClick={() => handleCopy(draft.body, 'email')}
                />
                <CopyButton
                  label="Copy all"
                  copied={copiedField === 'all'}
                  onClick={() => handleCopy(formatEmailForCopy(draft), 'all')}
                />
              </div>
            </div>

            <div
              className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.07)] p-7 flex flex-col gap-5 transition-all duration-500"
              style={{
                opacity: resultsVisible ? 1 : 0,
                transform: resultsVisible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: '150ms',
              }}
            >
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-4">
                  Strategy behind this email
                </p>
                <div className="flex flex-wrap gap-2">
                  {leverChips.map((lever) => (
                    <div
                      key={lever.label}
                      className="px-2.5 py-1 rounded-full text-[0.75rem] flex items-center gap-1 flex-shrink-0"
                      style={{
                        backgroundColor: lever.primary
                          ? 'rgba(191,87,48,0.07)'
                          : 'var(--secondary)',
                        border: lever.primary
                          ? '1px solid rgba(191,87,48,0.3)'
                          : '1px solid var(--border)',
                      }}
                    >
                      <span className="text-muted-foreground">{lever.label}:</span>
                      <span
                        className="font-medium"
                        style={{
                          color: lever.primary
                            ? 'var(--primary)'
                            : 'var(--foreground)',
                        }}
                      >
                        {lever.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {strategyCards.map((card, i) => (
                  <div
                    key={card.category}
                    className="border border-border rounded-xl overflow-hidden bg-background"
                  >
                    <button
                      onClick={() => toggleCard(i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/60 transition-colors duration-150"
                    >
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-foreground">
                        {card.category}
                      </span>
                      <ChevronDown
                        className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
                        style={{
                          transform: expandedCards.includes(i)
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    {expandedCards.includes(i) && (
                      <div className="px-4 pb-4 border-t border-border">
                        <div className="flex flex-wrap gap-1.5 mt-3 mb-2.5">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-xs text-muted-foreground bg-secondary border border-border"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {card.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {proofFacts.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden bg-background">
                  <button
                    onClick={() => setProofExpanded(!proofExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-secondary/60 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-foreground">
                        Proof discovered
                      </span>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[0.625rem] font-semibold bg-primary text-primary-foreground leading-none">
                        {proofFacts.length}
                      </span>
                    </div>
                    <ChevronDown
                      className="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200"
                      style={{
                        transform: proofExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  {proofExpanded && (
                    <div className="px-4 pb-4 border-t border-border">
                      <div className="flex flex-col gap-1.5 mt-3">
                        {proofFacts.map((fact) => (
                          <span
                            key={fact}
                            className="px-3 py-2 rounded-lg text-xs text-muted-foreground bg-secondary border border-border leading-relaxed"
                          >
                            {fact}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {appState === 'success' && (
          <div
            className="text-center mt-8 transition-opacity duration-500"
            style={{ opacity: resultsVisible ? 1 : 0 }}
          >
            <button
              onClick={handleReset}
              className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 decoration-border"
            >
              Start over
            </button>
          </div>
        )}

        <footer className="text-center mt-16 mb-2">
          <p className="text-xs text-muted-foreground/60">
            Email Lever Studio &middot; Built for cold outreach that actually works
          </p>
        </footer>
      </div>
    </div>
  )
}

function StepTracker({
  steps,
  currentStep,
  completedSteps,
  layout,
}: {
  steps: string[]
  currentStep: number
  completedSteps: number[]
  layout: 'horizontal' | 'vertical'
}) {
  if (layout === 'horizontal') {
    return (
      <div className="hidden md:flex items-start">
        {steps.map((step, i) => {
          const isDone = completedSteps.includes(i)
          const isActive = currentStep === i && !isDone
          return (
            <div key={step} className="flex items-start flex-1">
              <div className="flex flex-col items-center flex-1">
                <StepDot isDone={isDone} isActive={isActive} size="md" />
                <StepLabel step={step} isDone={isDone} isActive={isActive} />
              </div>
              {i < steps.length - 1 && (
                <div
                  className="flex-shrink-0 h-px mt-4 transition-colors duration-500"
                  style={{
                    backgroundColor: completedSteps.includes(i)
                      ? 'var(--primary)'
                      : 'var(--border)',
                    width: '40px',
                    minWidth: '20px',
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex md:hidden flex-col gap-3.5">
      {steps.map((step, i) => {
        const isDone = completedSteps.includes(i)
        const isActive = currentStep === i && !isDone
        return (
          <div key={step} className="flex items-center gap-3">
            <StepDot isDone={isDone} isActive={isActive} size="sm" />
            <StepLabel step={step} isDone={isDone} isActive={isActive} inline />
          </div>
        )
      })}
    </div>
  )
}

function StepDot({
  isDone,
  isActive,
  size,
}: {
  isDone: boolean
  isActive: boolean
  size: 'sm' | 'md'
}) {
  const dim = size === 'md' ? 'w-8 h-8' : 'w-7 h-7'
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center transition-all duration-400 flex-shrink-0`}
      style={{
        backgroundColor: isDone ? 'var(--primary)' : 'var(--card)',
        border: isDone
          ? '2px solid var(--primary)'
          : isActive
            ? '2px solid var(--primary)'
            : '2px solid var(--border)',
      }}
    >
      {isDone ? (
        <Check
          className={size === 'md' ? 'w-3.5 h-3.5 text-primary-foreground' : 'w-3 h-3 text-primary-foreground'}
          strokeWidth={2.5}
        />
      ) : isActive ? (
        <div className={`${size === 'md' ? 'w-2.5 h-2.5' : 'w-2 h-2'} rounded-full bg-primary animate-pulse`} />
      ) : (
        <div className={`${size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full bg-border`} />
      )}
    </div>
  )
}

function StepLabel({
  step,
  isDone,
  isActive,
  inline,
}: {
  step: string
  isDone: boolean
  isActive: boolean
  inline?: boolean
}) {
  return (
    <span
      className={`${inline ? 'text-sm' : 'text-[0.75rem] text-center mt-2 leading-snug px-1'} transition-colors duration-300`}
      style={{
        color: isDone
          ? 'var(--foreground)'
          : isActive
            ? 'var(--primary)'
            : 'var(--muted-foreground)',
        fontWeight: isDone || isActive ? 500 : 400,
      }}
    >
      {step}
    </span>
  )
}

function SkeletonCard({ variant }: { variant: 'email' | 'strategy' }) {
  if (variant === 'email') {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.06)] p-7">
        <div className="h-5 bg-muted rounded-full w-3/4 mb-2.5 animate-pulse" />
        <div className="h-3.5 bg-muted rounded-full w-1/2 mb-7 animate-pulse" style={{ animationDelay: '80ms' }} />
        <div className="h-px bg-muted mb-6" />
        <div className="space-y-2.5">
          {[100, 96, 91, 100, 78, 94, 88, 100, 65, 82, 100, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-muted rounded-full animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-8 pt-5 border-t border-border">
          {[88, 76, 70].map((w, i) => (
            <div key={i} className="h-7 bg-muted rounded-lg animate-pulse" style={{ width: `${w}px`, animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-[0_2px_16px_rgba(28,24,20,0.06)] p-7">
      <div className="h-3.5 bg-muted rounded-full w-1/2 mb-5 animate-pulse" />
      <div className="flex flex-wrap gap-2 mb-6">
        {[78, 62, 70, 88, 58, 74, 84, 66, 76].map((w, i) => (
          <div
            key={i}
            className="h-6 bg-muted rounded-full animate-pulse"
            style={{ width: `${w}px`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-11 bg-muted rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

function CopyButton({
  label,
  copied,
  onClick,
}: {
  label: string
  copied: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-secondary transition-all duration-150 text-foreground"
    >
      {copied ? (
        <Check className="w-3 h-3 text-primary" strokeWidth={2.5} />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
      {copied ? 'Copied!' : label}
    </button>
  )
}

const BODY_TEXT_CLASS =
  'w-full font-sans text-[0.875rem] leading-[1.72] whitespace-pre-wrap px-2 py-2 -mx-2'

const URL_REGEX = /(https?:\/\/[^\s<]+)/g

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_REGEX)
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <span
          key={i}
          className="text-primary underline underline-offset-2"
        >
          {part}
        </span>
      )
    }
    return part
  })
}

function EditableBody({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  const syncHeight = () => {
    const textarea = textareaRef.current
    const mirror = mirrorRef.current
    if (!textarea || !mirror) return
    textarea.style.height = 'auto'
    mirror.style.minHeight = 'auto'
    const height = Math.max(textarea.scrollHeight, mirror.scrollHeight)
    textarea.style.height = `${height}px`
    mirror.style.minHeight = `${height}px`
  }

  useEffect(() => {
    syncHeight()
  }, [value])

  return (
    <div className="relative">
      <div
        ref={mirrorRef}
        aria-hidden
        className={`${BODY_TEXT_CLASS} text-foreground pointer-events-none`}
      >
        {value ? renderTextWithLinks(value) : '\u00a0'}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={syncHeight}
        rows={1}
        spellCheck={false}
        className={`${BODY_TEXT_CLASS} absolute inset-0 text-transparent caret-foreground selection:bg-primary/20 bg-transparent border-none outline-none resize-none overflow-hidden`}
        style={{ WebkitTextFillColor: 'transparent' }}
      />
    </div>
  )
}
