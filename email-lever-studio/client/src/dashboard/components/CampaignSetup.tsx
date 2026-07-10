import { useMemo, useState } from 'react'
import type { FC } from 'react'
import {
  AnnotationDots,
  ArrowLeft,
  ArrowUp,
  Building07,
  CheckCircle,
  Edit02,
  PlayCircle,
  Trash01,
  TrendUp01,
  Trophy01,
  Users01,
} from '@untitledui/icons'
import { Button } from '@ui/components/base/buttons/button'
import { ButtonUtility } from '@ui/components/base/buttons/button-utility'
import { Badge } from '@ui/components/base/badges/badges'
import { Input } from '@ui/components/base/input/input'
import { TextArea } from '@ui/components/base/textarea/textarea'
import { NativeSelect } from '@ui/components/base/select/select-native'
import { FeaturedIcon } from '@ui/components/foundations/featured-icon/featured-icon'
import { INTENT_OPTIONS } from '../../../../shared/schema.ts'
import type { SocialProofAssets } from '../../../../shared/schema.ts'
import { researchSocialProof } from '../../lib/api'
import { createCampaignForCompany, updateCampaignBrief } from '../dataSource'
import type { Campaign, CampaignGoal, Company } from '../types'

type ProofFieldKey = keyof SocialProofAssets
type IconType = FC<{ className?: string }>

const PROOF_FIELDS: {
  key: ProofFieldKey
  label: string
  hint: string
  placeholder: string
  icon: IconType
}[] = [
  {
    key: 'recognizableCustomer',
    label: 'Recognizable customer',
    hint: 'A brand or name people already trust',
    placeholder: 'e.g. Trusted by Fortune 500 beverage brands',
    icon: Building07,
  },
  {
    key: 'specificResult',
    label: 'Specific result',
    hint: 'A measurable outcome with teeth',
    placeholder: 'e.g. 32% lift in reply rate',
    icon: TrendUp01,
  },
  {
    key: 'customerQuote',
    label: 'Customer quote',
    hint: 'Short, concrete language from a real customer',
    placeholder: 'e.g. "Best partner we have worked with."',
    icon: AnnotationDots,
  },
  {
    key: 'customerCount',
    label: 'Customer count',
    hint: 'Scale that makes the claim feel proven',
    placeholder: 'e.g. 12,000+ teams onboarded',
    icon: Users01,
  },
  {
    key: 'recentWin',
    label: 'Recent win',
    hint: 'Something timely that creates momentum',
    placeholder: 'e.g. Signed 3 retail pilots in March',
    icon: Trophy01,
  },
]

type ProofDraft = Record<ProofFieldKey, string>
const PROOF_TEXTAREA_CLASS =
  'min-h-10 max-h-32 resize-none overflow-y-auto pr-11 [field-sizing:content]'

function ProofComposer({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  onFocus,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  onFocus?: () => void
}) {
  const canSubmit = value.trim().length > 0

  return (
    <div className="relative">
      <TextArea
        rows={1}
        size="sm"
        placeholder={placeholder}
        textAreaClassName={PROOF_TEXTAREA_CLASS}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            if (canSubmit) onSubmit()
          }
        }}
        aria-label={label}
      />
      {canSubmit && (
        <ButtonUtility
          size="xs"
          color="tertiary"
          icon={ArrowUp}
          aria-label={`Save ${label}`}
          onClick={onSubmit}
          className="absolute right-2 top-1/2 size-7 -translate-y-1/2 rounded-full bg-brand-solid text-white shadow-xs hover:bg-brand-solid_hover hover:text-white"
        />
      )}
    </div>
  )
}

function toProofDraft(assets: SocialProofAssets | undefined): ProofDraft {
  return PROOF_FIELDS.reduce((acc, { key }) => {
    acc[key] = assets?.[key]?.trim() ? String(assets[key]) : ''
    return acc
  }, {} as ProofDraft)
}

function toProofAssets(draft: ProofDraft): SocialProofAssets {
  const assets: SocialProofAssets = {}
  for (const { key } of PROOF_FIELDS) {
    const value = draft[key]?.trim()
    if (value) assets[key] = value
  }
  return assets
}

function ProofAssetCard({
  label,
  hint,
  placeholder,
  icon,
  value,
  savedValue,
  isEditing,
  onEdit,
  onSave,
  onClear,
  onChange,
}: {
  label: string
  hint: string
  placeholder: string
  icon: IconType
  value: string
  savedValue: string
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onClear: () => void
  onChange: (next: string) => void
}) {
  const filled = savedValue.trim().length > 0
  const isQuote = label.toLowerCase().includes('quote')

  return (
    <div
      className={
        filled
          ? 'rounded-2xl bg-primary p-4 ring-1 ring-secondary transition-shadow hover:shadow-sm'
          : 'rounded-2xl border border-dashed border-secondary bg-secondary/40 p-4'
      }
    >
      <div className="flex items-start gap-3.5">
        <FeaturedIcon
          icon={icon}
          color={filled ? 'brand' : 'gray'}
          theme="light"
          size="md"
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
                <span className="font-semibold text-primary">{label}</span>
                <span className="text-xs text-tertiary">{hint}</span>
              </p>
            </div>

            {!isEditing && (
              <div className="flex shrink-0 items-center gap-1">
                {filled && (
                  <>
                    <ButtonUtility
                      size="xs"
                      color="tertiary"
                      icon={Edit02}
                      tooltip="Edit"
                      aria-label={`Edit ${label}`}
                      onClick={onEdit}
                    />
                    <ButtonUtility
                      size="xs"
                      color="tertiary"
                      icon={Trash01}
                      tooltip="Remove"
                      aria-label={`Remove ${label}`}
                      onClick={onClear}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-3">
              <ProofComposer
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onSubmit={onSave}
              />
            </div>
          ) : filled ? (
            isQuote ? (
              <blockquote className="mt-3 border-l-2 border-brand pl-3 text-sm leading-relaxed text-secondary italic">
                {value}
              </blockquote>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-secondary">{value}</p>
            )
          ) : (
            <div className="mt-3">
              <ProofComposer
                label={label}
              placeholder={placeholder}
              value={value}
                onChange={(next) => {
                  onEdit()
                  onChange(next)
                }}
              onFocus={onEdit}
                onSubmit={onSave}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

type Props = {
  campaign?: Campaign
  company: Company
  /** Called after the brief + social proof are approved so the parent can refresh. */
  onApproved: () => void
  /** Called after a draft setup creates its real campaign. */
  onStarted?: (campaign: Campaign) => void
}

export default function CampaignSetup({
  campaign,
  company,
  onApproved,
  onStarted,
}: Props) {
  const [startedCampaign, setStartedCampaign] = useState<Campaign | undefined>(
    campaign,
  )
  const setupCampaign = startedCampaign ?? campaign
  const [step, setStep] = useState<'brief' | 'proof'>(
    campaign?.socialProofStatus === 'researched' ? 'proof' : 'brief',
  )
  const [productDescription, setProductDescription] = useState(
    campaign?.productDescription ?? '',
  )
  const [productUrl, setProductUrl] = useState(campaign?.productUrl ?? '')
  const [goal, setGoal] = useState<CampaignGoal | ''>(campaign?.goal ?? '')
  const [proof, setProof] = useState<ProofDraft>(() =>
    toProofDraft(campaign?.socialProofAssets),
  )
  const [editingKey, setEditingKey] = useState<ProofFieldKey | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [researching, setResearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasDescription = productDescription.trim().length > 0
  const hasProductUrl = productUrl.trim().length > 0
  const briefValid = (hasDescription || hasProductUrl) && goal !== ''

  const goalOptions = useMemo(
    () => [
      { value: '', label: 'Select a goal', disabled: true },
      ...INTENT_OPTIONS,
    ],
    [],
  )

  const filledProofCount = useMemo(
    () => PROOF_FIELDS.filter(({ key }) => proof[key].trim().length > 0).length,
    [proof],
  )

  const handleResearch = async () => {
    if (!briefValid || researching) return
    setResearching(true)
    setError(null)
    setWarnings([])

    try {
      const trimmedDescription = productDescription.trim()
      const trimmedUrl = productUrl.trim()
      const workingCampaign =
        setupCampaign ?? (await createCampaignForCompany(company))
      setStartedCampaign(workingCampaign)

      await updateCampaignBrief(workingCampaign.id, {
        productDescription: trimmedDescription || null,
        productUrl: trimmedUrl || null,
        goal: goal || null,
      })

      const result = await researchSocialProof({
        productDescription: trimmedDescription || undefined,
        productUrl: trimmedUrl || undefined,
      })

      const { warnings: resultWarnings, ...assets } = result
      const draft = toProofDraft(assets)

      await updateCampaignBrief(workingCampaign.id, {
        socialProofAssets: toProofAssets(draft),
        socialProofStatus: 'researched',
      })

      setProof(draft)
      setWarnings(resultWarnings ?? [])
      setEditingKey(null)
      setStep('proof')
      if (!campaign) onStarted?.(workingCampaign)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not research social proof. Please try again.',
      )
    } finally {
      setResearching(false)
    }
  }

  const handleApprove = async () => {
    if (saving || !setupCampaign) return
    setSaving(true)
    setError(null)

    try {
      await updateCampaignBrief(setupCampaign.id, {
        socialProofAssets: toProofAssets(proof),
        socialProofStatus: 'approved',
      })
      onApproved()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your changes. Please try again.',
      )
      setSaving(false)
    }
  }

  const startEditing = (key: ProofFieldKey) => {
    setEditingKey(key)
    setEditDraft(proof[key])
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditDraft('')
  }

  const saveEditing = (key: ProofFieldKey) => {
    setProof((prev) => ({ ...prev, [key]: editDraft }))
    setEditingKey(null)
    setEditDraft('')
  }

  const clearProof = (key: ProofFieldKey) => {
    setProof((prev) => ({ ...prev, [key]: '' }))
    if (editingKey === key) cancelEditing()
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-display-xs font-semibold text-primary">
            {step === 'brief'
              ? 'Tell us about this campaign'
              : 'Review the social proof we found'}
          </h2>
          {step === 'proof' && (
            <Badge color={filledProofCount > 0 ? 'brand' : 'gray'} size="sm">
              {filledProofCount} of {PROOF_FIELDS.length} ready
            </Badge>
          )}
        </div>
        <p className="text-sm text-tertiary">
          {step === 'brief'
            ? 'A short brief helps us research the right social proof before generating emails.'
            : 'Keep what lands. Edit what needs fine-tuning. Drop anything that feels weak.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-error-primary px-4 py-3 text-sm text-error-primary ring-1 ring-error_subtle">
          {error}
        </div>
      )}

      {step === 'brief' ? (
        <div className="flex flex-col gap-5 rounded-2xl bg-primary p-6 ring-1 ring-secondary">
          <p className="text-sm text-tertiary">
            Add a product URL, a short description, or both.
          </p>

          <Input
            label="Product URL"
            type="url"
            placeholder="https://example.com/product"
            value={productUrl}
            onChange={setProductUrl}
          />

          <TextArea
            label="What are you marketing?"
            rows={4}
            placeholder="Describe the product or service, who it is for, and what makes it worth their time."
            value={productDescription}
            onChange={setProductDescription}
          />

          <NativeSelect
            label="Campaign goal"
            size="md"
            value={goal}
            onChange={(e) => setGoal(e.target.value as CampaignGoal | '')}
            options={goalOptions}
          />

          <div className="flex justify-end">
            <Button
              color="primary"
              size="md"
              iconLeading={PlayCircle}
              isDisabled={!briefValid || researching}
              isLoading={researching}
              onClick={handleResearch}
            >
              {researching ? 'Starting…' : 'Start Campaign'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {warnings.length > 0 && (
            <div className="rounded-xl bg-warning-primary px-4 py-3 text-sm text-warning-primary ring-1 ring-secondary">
              <p className="font-medium">Some sources could not be read:</p>
              <ul className="mt-1 list-inside list-disc">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {filledProofCount === 0 && (
            <div className="rounded-2xl bg-secondary px-5 py-4 ring-1 ring-secondary">
              <p className="text-sm font-medium text-primary">
                Nothing concrete turned up automatically.
              </p>
              <p className="mt-1 text-sm text-tertiary">
                Add anything you know, or approve and continue without social
                proof.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {PROOF_FIELDS.map(({ key, label, hint, placeholder, icon }) => {
              const isEditing = editingKey === key
              return (
                <ProofAssetCard
                  key={key}
                  label={label}
                  hint={hint}
                  placeholder={placeholder}
                  icon={icon}
                  value={isEditing ? editDraft : proof[key]}
                  savedValue={proof[key]}
                  isEditing={isEditing}
                  onEdit={() => startEditing(key)}
                  onSave={() => saveEditing(key)}
                  onClear={() => clearProof(key)}
                  onChange={setEditDraft}
                />
              )
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button
              color="tertiary"
              size="md"
              iconLeading={ArrowLeft}
              isDisabled={saving}
              onClick={() => {
                cancelEditing()
                setStep('brief')
              }}
            >
              Back to brief
            </Button>
            <Button
              color="primary"
              size="md"
              iconLeading={CheckCircle}
              isDisabled={saving}
              isLoading={saving}
              onClick={handleApprove}
            >
              Approve social proof
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
