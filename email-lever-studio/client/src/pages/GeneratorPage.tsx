import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Check, Copy, ChevronDown, Loader2, ArrowRight, Zap } from 'lucide-react'
import { Badge } from '@ui/components/base/badges/badges'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import { NativeSelect } from '@ui/components/base/select/select-native'
import { ProgressBar } from '@ui/components/base/progress-indicators/progress-indicators'
import {
  generateEmail,
  DEFAULT_BANDIT_CONTEXT,
  type BanditContext,
  type LeverSource,
} from '../lib/api'
import {
  buildLeverChips,
  buildProofFacts,
  buildStrategyCards,
  formatEmailForCopy,
  type LeverChip,
  type StrategyCard,
} from '../lib/display'
import PolicyPanel from '../PolicyPanel'
import { saveGeneratedEmail } from '../dashboard/api'
import { MOCK_CAMPAIGNS } from '../dashboard/mock'
import type { EmailDraft, LeverSuggestion } from '../../../shared/schema.ts'
import type { StyleKey } from '../../../shared/writing-styles.ts'

type AppState = 'idle' | 'generating' | 'success' | 'error'

const STEPS = [
  'Reading your pages',
  'Researching social proof',
  'Choosing email strategy',
  'Writing your email',
]

const AUDIENCE_FIELDS: {
  key: keyof BanditContext
  label: string
  options: { value: string; label: string }[]
}[] = [
  {
    key: 'segment',
    label: 'Segment',
    options: [
      { value: 'cold_prospect', label: 'Cold prospect' },
      { value: 'warm_lead', label: 'Warm lead' },
      { value: 'trial_active', label: 'Trial active' },
      { value: 'trial_expiring', label: 'Trial expiring' },
      { value: 'first_time_buyer', label: 'First-time buyer' },
      { value: 'repeat', label: 'Repeat' },
      { value: 'vip', label: 'VIP' },
      { value: 'churned', label: 'Churned' },
      { value: 'win_back', label: 'Win-back' },
      { value: 'referral_source', label: 'Referral source' },
      { value: 'partner_affiliate', label: 'Partner / affiliate' },
      { value: 'investor_advisor', label: 'Investor / advisor' },
    ],
  },
  {
    key: 'intent',
    label: 'Intent',
    options: [
      { value: 'drive_purchase', label: 'Drive purchase' },
      { value: 'book_meeting', label: 'Book meeting' },
      { value: 'get_reply', label: 'Get reply' },
      { value: 'click_to_page', label: 'Click to page' },
      { value: 'collect_info', label: 'Collect info' },
      { value: 'referral', label: 'Referral' },
    ],
  },
  {
    key: 'industry',
    label: 'Industry',
    options: [
      { value: 'ecommerce', label: 'E-commerce' },
      { value: 'saas', label: 'SaaS' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'finance', label: 'Finance' },
      { value: 'education', label: 'Education' },
      { value: 'agency', label: 'Agency' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    key: 'seniority',
    label: 'Seniority',
    options: [
      { value: 'ic', label: 'IC' },
      { value: 'manager', label: 'Manager' },
      { value: 'director', label: 'Director' },
      { value: 'exec', label: 'VP/C-level' },
    ],
  },
]

export default function GeneratorPage() {
  const navigate = useNavigate()
  const [appState, setAppState] = useState<AppState>('idle')
  const [company, setCompany] = useState('')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState<BanditContext>(DEFAULT_BANDIT_CONTEXT)
  const [leverSource, setLeverSource] = useState<LeverSource | null>(null)
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
  const [lastLevers, setLastLevers] = useState<LeverSuggestion | null>(null)
  const [lastStyleKey, setLastStyleKey] = useState<StyleKey | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const defaultCampaignId = MOCK_CAMPAIGNS[0]?.id ?? 'camp-1'

  const canGenerate = company.trim().length > 0 && product.trim().length > 0

  const handleGenerate = async () => {
    if (!canGenerate || appState === 'generating') return

    setAppState('generating')
    setErrorMessage(null)
    setCurrentStep(0)
    setCompletedSteps([])
    setResultsVisible(false)

    try {
      const result = await generateEmail(company, product, audience, (step) => {
        setCurrentStep(step)
        if (step > 0) {
          setCompletedSteps((prev) =>
            prev.includes(step - 1) ? prev : [...prev, step - 1],
          )
        }
      })

      setCompletedSteps([0, 1, 2, 3])
      setDraft(result.draft)
      setLastLevers(result.levers)
      setLastStyleKey(result.styleKey)
      setSaveStatus('idle')
      setLeverSource(result.leverSource)
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
      setLastLevers(null)
      setLastStyleKey(null)
      setSaveStatus('idle')
      setErrorMessage(null)
      setLeverSource(null)
    }, 200)
  }

  const handleSaveToCampaign = async () => {
    if (!draft || !lastLevers || saveStatus === 'saving') return
    setSaveStatus('saving')
    try {
      await saveGeneratedEmail({
        campaignId: defaultCampaignId,
        draft,
        levers: lastLevers,
        styleKey: lastStyleKey ?? undefined,
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('error')
    }
  }

  const showInputPanel = appState === 'idle' || appState === 'generating' || appState === 'error'

  return (
    <div className="min-h-dvh bg-primary_alt py-16 px-4">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center">
          <div className="mb-6 flex justify-center">
            <Badge color="brand" className="inline-flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs font-semibold tracking-[0.12em] uppercase">
                Email Lever Studio
              </span>
            </Badge>
          </div>

          <h1 className="text-display-md md:text-display-lg font-semibold text-primary tracking-tight">
            Paste your company and product —{' '}
            <span className="text-brand-secondary">get a research‑backed</span> cold email
          </h1>
          <p className="mt-3 text-md text-tertiary max-w-xl mx-auto">
            In about 20 seconds. Grounded in real social proof, a clear persuasion
            strategy, and a subject line worth opening.
          </p>
        </header>

        {showInputPanel && (
          <section className="mt-10 mb-6 rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company"
                value={company}
                onChange={setCompany}
                onKeyDown={(e) => e.key === 'Enter' && void handleGenerate()}
                placeholder="https://mycompany.com"
                isDisabled={appState === 'generating'}
                hint="Name or website URL"
              />
              <Input
                label="Product"
                value={product}
                onChange={setProduct}
                onKeyDown={(e) => e.key === 'Enter' && void handleGenerate()}
                placeholder="https://myproduct.com"
                isDisabled={appState === 'generating'}
                hint="Name, description, or product page URL"
              />
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                Audience
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {AUDIENCE_FIELDS.map((field) => (
                  <NativeSelect
                    key={field.key}
                    label={field.label}
                    size="sm"
                    value={audience[field.key]}
                    disabled={appState === 'generating'}
                    onChange={(e) =>
                      setAudience((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    options={field.options}
                  />
                ))}
              </div>
            </div>

            {appState === 'error' && errorMessage && (
              <p className="mt-5 text-sm text-error-primary text-center">{errorMessage}</p>
            )}

            <div className="mt-6">
              <Button
                className="w-full"
                size="xl"
                iconTrailing={ArrowRight}
                isDisabled={!canGenerate || appState === 'generating'}
                isLoading={appState === 'generating'}
                showTextWhileLoading
                onClick={() => void handleGenerate()}
              >
                Generate email
              </Button>
            </div>
          </section>
        )}

        {appState === 'generating' && (
          <section className="mb-6">
            <div className="rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt p-6 md:p-8 mb-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                  In progress
                </p>
                <span className="text-xs font-medium text-tertiary tabular-nums">
                  {Math.round((completedSteps.length / STEPS.length) * 100)}%
                </span>
              </div>

              <div className="mt-4">
                <ProgressBar
                  value={(completedSteps.length / STEPS.length) * 100}
                  className="h-2.5"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                {STEPS.map((label, i) => {
                  const isDone = completedSteps.includes(i)
                  const isActive = currentStep === i && !isDone
                  return (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary px-4 py-3"
                    >
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary ring-1 ring-primary">
                        {isDone ? (
                          <Check className="h-4 w-4 text-fg-success-primary" />
                        ) : isActive ? (
                          <Loader2 className="h-4 w-4 animate-spin text-fg-brand-primary" />
                        ) : (
                          <span className="text-xs font-semibold text-tertiary">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      <span
                        className={
                          isDone
                            ? 'text-sm font-medium text-primary'
                            : isActive
                              ? 'text-sm font-medium text-secondary'
                              : 'text-sm font-medium text-tertiary'
                        }
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
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
            <div className="rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt p-6 md:p-8 flex flex-col">
              <div className="mb-6 space-y-4">
                <Input
                  label="Subject"
                  size="lg"
                  value={draft.subject}
                  onChange={(value) => updateDraft({ subject: value })}
                  inputClassName="font-semibold"
                />
                {draft.preheader !== undefined && draft.preheader !== '' && (
                  <Input
                    label="Preheader"
                    size="md"
                    value={draft.preheader}
                    onChange={(value) => updateDraft({ preheader: value })}
                    placeholder="Optional"
                    inputClassName="italic"
                  />
                )}
              </div>

              <div className="border-t border-secondary pt-6 flex-1">
                <EditableBody
                  value={draft.body}
                  onChange={(body) => updateDraft({ body })}
                />
              </div>

              <div className="flex gap-2 mt-6 pt-6 border-t border-secondary flex-wrap">
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
              className="rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt p-6 md:p-8 flex flex-col gap-6 transition-all duration-500"
              style={{
                opacity: resultsVisible ? 1 : 0,
                transform: resultsVisible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: '150ms',
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                    Strategy behind this email
                  </p>
                  {leverSource && (
                    <span
                      title={
                        leverSource === 'bandit'
                          ? 'Levers picked by the trained contextual bandit policy'
                          : 'Bandit service unreachable — levers suggested by Claude'
                      }
                    >
                      <Badge color={leverSource === 'bandit' ? 'brand' : 'gray'}>
                        {leverSource === 'bandit' ? 'Bandit policy' : 'Claude fallback'}
                      </Badge>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {leverChips.map((lever) => (
                    <Badge
                      key={lever.label}
                      color={lever.primary ? 'brand' : 'gray'}
                      size="sm"
                      className="flex items-center gap-1.5"
                    >
                      <span className="opacity-70">{lever.label}:</span>
                      <span className="font-medium">{lever.value}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {strategyCards.map((card, i) => (
                  <div
                    key={card.category}
                    className="rounded-xl overflow-hidden ring-1 ring-secondary_alt bg-primary"
                  >
                    <button
                      onClick={() => toggleCard(i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary_hover transition-colors duration-150"
                    >
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        {card.category}
                      </span>
                      <ChevronDown
                        className="w-4 h-4 text-fg-quaternary transition-transform duration-200"
                        style={{
                          transform: expandedCards.includes(i)
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                        }}
                      />
                    </button>
                    {expandedCards.includes(i) && (
                      <div className="px-4 pb-4 border-t border-secondary">
                        <div className="flex flex-wrap gap-1.5 mt-3 mb-2.5">
                          {card.tags.map((tag) => (
                            <Badge key={tag} color="gray" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-tertiary italic leading-relaxed">
                          {card.reasoning}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {proofFacts.length > 0 && (
                <div className="rounded-xl overflow-hidden ring-1 ring-secondary_alt bg-primary">
                  <button
                    onClick={() => setProofExpanded(!proofExpanded)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary_hover transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        Proof discovered
                      </span>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[0.625rem] font-semibold bg-brand-solid text-white leading-none">
                        {proofFacts.length}
                      </span>
                    </div>
                    <ChevronDown
                      className="w-4 h-4 text-fg-quaternary transition-transform duration-200"
                      style={{
                        transform: proofExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>
                  {proofExpanded && (
                    <div className="px-4 pb-4 border-t border-secondary">
                      <div className="flex flex-col gap-1.5 mt-3">
                        {proofFacts.map((fact) => (
                          <span
                            key={fact}
                            className="px-3 py-2 rounded-lg text-sm text-tertiary bg-secondary ring-1 ring-secondary_alt leading-relaxed"
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
            className="text-center mt-8 flex flex-col items-center gap-3 transition-opacity duration-500"
            style={{ opacity: resultsVisible ? 1 : 0 }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                color="secondary"
                size="md"
                isLoading={saveStatus === 'saving'}
                isDisabled={!lastLevers || saveStatus === 'saved'}
                onClick={() => void handleSaveToCampaign()}
              >
                {saveStatus === 'saved'
                  ? 'Saved to campaign'
                  : saveStatus === 'error'
                    ? 'Save failed — retry'
                    : 'Save to campaign'}
              </Button>
              {saveStatus === 'saved' && (
                <Button
                  color="link-color"
                  size="md"
                  onClick={() =>
                    navigate(`/dashboard/campaign/${defaultCampaignId}`)
                  }
                >
                  View in dashboard
                </Button>
              )}
            </div>
            <Button color="link-gray" size="lg" onClick={handleReset}>
              Start over
            </Button>
          </div>
        )}

        <PolicyPanel />

        <footer className="text-center mt-16 mb-2">
          <p className="text-xs text-tertiary">
            Email Lever Studio &middot; Built for cold outreach that actually works
          </p>
        </footer>
      </div>
    </div>
  )
}

function SkeletonCard({ variant }: { variant: 'email' | 'strategy' }) {
  if (variant === 'email') {
    return (
      <div className="rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt p-6 md:p-8">
        <div className="h-5 bg-secondary rounded-full w-3/4 mb-2.5 animate-pulse" />
        <div className="h-3.5 bg-secondary rounded-full w-1/2 mb-7 animate-pulse" style={{ animationDelay: '80ms' }} />
        <div className="h-px bg-secondary mb-6" />
        <div className="space-y-2.5">
          {[100, 96, 91, 100, 78, 94, 88, 100, 65, 82, 100, 70].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-secondary rounded-full animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        <div className="flex gap-2 mt-8 pt-6 border-t border-secondary">
          {[88, 76, 70].map((w, i) => (
            <div
              key={i}
              className="h-7 bg-secondary rounded-lg animate-pulse"
              style={{ width: `${w}px`, animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-primary shadow-lg ring-1 ring-secondary_alt p-6 md:p-8">
      <div className="h-3.5 bg-secondary rounded-full w-1/2 mb-5 animate-pulse" />
      <div className="flex flex-wrap gap-2 mb-6">
        {[78, 62, 70, 88, 58, 74, 84, 66, 76].map((w, i) => (
          <div
            key={i}
            className="h-6 bg-secondary rounded-full animate-pulse"
            style={{ width: `${w}px`, animationDelay: `${i * 70}ms` }}
          />
        ))}
      </div>
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-11 bg-secondary rounded-xl animate-pulse"
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
    <Button
      size="sm"
      color="secondary"
      iconLeading={copied ? Check : Copy}
      onClick={onClick}
    >
      {copied ? 'Copied' : label}
    </Button>
  )
}

const BODY_TEXT_CLASS =
  'w-full text-sm leading-relaxed whitespace-pre-wrap px-2 py-2 -mx-2'

const URL_REGEX = /(https?:\/\/[^\s<]+)/g

function renderTextWithLinks(text: string) {
  const parts = text.split(URL_REGEX)
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <span
          key={i}
          className="text-brand-secondary underline underline-offset-3"
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
        className={`${BODY_TEXT_CLASS} text-secondary pointer-events-none`}
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
        className={`${BODY_TEXT_CLASS} absolute inset-0 text-transparent caret-brand selection:bg-utility-brand-100 bg-transparent border-none outline-none resize-none overflow-hidden`}
        style={{ WebkitTextFillColor: 'transparent' }}
      />
    </div>
  )
}
