import type {
  ColdContext,
  EmailDraft,
  LeverSuggestion,
  SocialProofAssets,
} from '../../../shared/schema.ts'
import {
  applySocialProofFromAssets,
  reconcileSocialProofWithAssets,
} from '../../../shared/schema.ts'
import { applyGenerationDefaults } from '../../../shared/generation-defaults.ts'
import type { StyleKey } from '../../../shared/writing-styles.ts'
import { DEFAULT_RESEARCH_CONFIG, type ResearchConfig } from './display.ts'

const RESEARCH_CONFIG = DEFAULT_RESEARCH_CONFIG

const API_BASE = '/api'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Something went wrong — try again.')
  }
  return data
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

// --- Bandit audience context (mirrors bandit_mvp/levers.py CONTEXT) ---

export type BanditContext = {
  segment: string
  intent: string
  industry: string
  seniority: string
}

export const DEFAULT_BANDIT_CONTEXT: BanditContext = {
  segment: 'cold_prospect',
  intent: 'drive_purchase',
  industry: 'ecommerce',
  seniority: 'ic',
}

const SENIORITY_LABELS: Record<string, string> = {
  ic: 'IC',
  manager: 'Manager',
  director: 'Director',
  exec: 'VP/C-level',
}

type BanditPickResponse = {
  decisionId: string
  context: BanditContext
  recipe: Record<string, string>
  levers: LeverSuggestion
  propensity: number
  candidateCount: number
}

export type LeverSource = 'bandit' | 'claude'

function buildContext(
  company: string,
  product: string,
  assets: SocialProofAssets,
  audience: BanditContext,
): ColdContext {
  const companyTrimmed = company.trim()
  const productTrimmed = product.trim()

  return {
    recipientName: 'there',
    recipientEmail: 'prospect@example.com',
    companyName: isUrl(companyTrimmed) ? undefined : companyTrimmed,
    industry: audience.industry,
    seniority: SENIORITY_LABELS[audience.seniority] ?? audience.seniority,
    segmentAtSend: audience.segment as ColdContext['segmentAtSend'],
    sequenceNumber: 1,
    notes: `Campaign: Cold D2C\n\n${productTrimmed}`,
    socialProofAssets: assets,
  }
}

export type GenerationResult = {
  draft: EmailDraft
  levers: LeverSuggestion
  proofAssets: SocialProofAssets
  researchConfig: ResearchConfig
  styleKey: StyleKey
  styleAuthor: string
  leverSource: LeverSource
  decisionId?: string
  propensity?: number
}

export type SocialProofResearchResult = SocialProofAssets & {
  warnings?: string[]
}

/**
 * Research social proof for a campaign brief. `productUrl` is treated as either
 * a company or product URL depending on shape; `productDescription` is optional
 * free text. Returns the discovered assets plus any fetch warnings.
 */
export async function researchSocialProof(input: {
  productDescription?: string
  productUrl?: string
}): Promise<SocialProofResearchResult> {
  const description = input.productDescription?.trim() || undefined
  const url = input.productUrl?.trim() || undefined
  const productUrl = url && isUrl(url) ? url : undefined

  return postJson<SocialProofResearchResult>('/research-social-proof', {
    productUrl,
    productDescription: description,
    config: RESEARCH_CONFIG,
  })
}

export type StepCallback = (step: number) => void

/** Bandit picks the levers; Claude suggest-levers is the fallback when the service is down. */
async function pickLevers(
  audience: BanditContext,
  context: ColdContext,
  assets: SocialProofAssets,
): Promise<{
  levers: LeverSuggestion
  source: LeverSource
  decisionId?: string
  propensity?: number
}> {
  try {
    const pick = await postJson<BanditPickResponse>('/bandit/pick', {
      context: audience,
    })
    // The bandit chose the social proof levers; only reconcile them with what the
    // research actually found (never fabricate proof the assets can't back).
    reconcileSocialProofWithAssets(pick.levers, assets)
    return {
      levers: pick.levers,
      source: 'bandit',
      decisionId: pick.decisionId,
      propensity: pick.propensity,
    }
  } catch {
    const levers = await postJson<LeverSuggestion>('/suggest-levers', { context })
    applySocialProofFromAssets(levers, assets)
    return { levers, source: 'claude' }
  }
}

export async function generateEmail(
  company: string,
  product: string,
  audience: BanditContext = DEFAULT_BANDIT_CONTEXT,
  onStepChange?: StepCallback,
): Promise<GenerationResult> {
  const companyTrimmed = company.trim()
  const productTrimmed = product.trim()
  const companyUrl = isUrl(companyTrimmed) ? companyTrimmed : undefined
  const productUrl = isUrl(productTrimmed) ? productTrimmed : undefined
  const productDescription = !isUrl(productTrimmed) ? productTrimmed : undefined

  onStepChange?.(0)

  const proofAssets = await postJson<SocialProofAssets>(
    '/research-social-proof',
    {
      companyUrl,
      productUrl,
      productDescription,
      config: RESEARCH_CONFIG,
    },
  )

  onStepChange?.(1)

  const context = buildContext(companyTrimmed, productTrimmed, proofAssets, audience)

  onStepChange?.(2)

  const { levers, source, decisionId, propensity } = await pickLevers(
    audience,
    context,
    proofAssets,
  )

  const { styleKey, styleText, styleAuthor } = applyGenerationDefaults(
    levers,
    proofAssets,
    { applyPersuasionDefault: source !== 'bandit' },
  )

  onStepChange?.(3)

  const draft = await postJson<EmailDraft>('/generate-draft', {
    context,
    levers,
    style: styleText,
    leverSource: source,
  })

  return {
    draft,
    levers,
    proofAssets,
    researchConfig: RESEARCH_CONFIG,
    styleKey,
    styleAuthor,
    leverSource: source,
    decisionId,
    propensity,
  }
}

// --- Policy panel (train on logged data + what it learned) ---

export type PolicyValue = {
  baseline: number
  random: number
  greedy: number
  lift: number
  learned: boolean
  trials: number
  distinctRecipes: number
}

export type TrainResult = {
  ok: boolean
  loaded: number
  epochs: number
  curve: { step: number; avgReward: number }[]
  policyValue: PolicyValue | null
}

export type RecoveryResult = {
  trials: number
  top: Record<string, [string, number][]>
  expectation: Record<string, string>
}

export async function trainOnLoggedData(): Promise<TrainResult> {
  return postJson<TrainResult>('/bandit/train', {})
}

export async function fetchRecovery(trials = 1500): Promise<RecoveryResult> {
  const res = await fetch(`${API_BASE}/bandit/recovery?trials=${trials}`)
  const data = (await res.json()) as RecoveryResult & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Failed to sample the trained policy.')
  }
  return data
}
