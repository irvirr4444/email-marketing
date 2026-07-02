import type {
  ColdContext,
  EmailDraft,
  LeverSuggestion,
  SocialProofAssets,
} from '../../../shared/schema.ts'
import { applySocialProofFromAssets } from '../../../shared/schema.ts'
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

function buildContext(
  company: string,
  product: string,
  assets: SocialProofAssets,
): ColdContext {
  const companyTrimmed = company.trim()
  const productTrimmed = product.trim()

  return {
    recipientName: 'there',
    recipientEmail: 'prospect@example.com',
    companyName: isUrl(companyTrimmed) ? undefined : companyTrimmed,
    segmentAtSend: 'cold_prospect',
    sequenceNumber: 1,
    notes: `Campaign: Cold D2C\n\n${isUrl(productTrimmed) ? productTrimmed : productTrimmed}`,
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
}

export type StepCallback = (step: number) => void

export async function generateEmail(
  company: string,
  product: string,
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

  const context = buildContext(companyTrimmed, productTrimmed, proofAssets)

  onStepChange?.(2)

  const levers = await postJson<LeverSuggestion>('/suggest-levers', {
    context,
  })

  applySocialProofFromAssets(levers, proofAssets)
  const { styleKey, styleText, styleAuthor } = applyGenerationDefaults(levers, proofAssets)

  onStepChange?.(3)

  const draft = await postJson<EmailDraft>('/generate-draft', {
    context,
    levers,
    style: styleText,
  })

  return { draft, levers, proofAssets, researchConfig: RESEARCH_CONFIG, styleKey, styleAuthor }
}
