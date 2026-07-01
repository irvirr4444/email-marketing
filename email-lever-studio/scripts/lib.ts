import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  ColdContext,
  EmailDraft,
  LeverSuggestion,
  ResearchDepth,
  ResearchLayer,
  ResearchTone,
  SocialProofAssets,
  SocialProofResearchConfig,
} from '../shared/schema.ts'
import {
  RESEARCH_DEPTH_OPTIONS,
  RESEARCH_LAYER_OPTIONS,
  RESEARCH_TONE_OPTIONS,
} from '../shared/schema.ts'

export const API_BASE = 'http://127.0.0.1:3001'
const __dirname = dirname(fileURLToPath(import.meta.url))
export const OUTPUT_DIR = resolve(__dirname, '../output')

export type ResearchCliOptions = {
  research: boolean
  researchLayers?: string
  researchTone?: string
  researchDepth?: string
  socialProofResult?: string
  socialProofCustomer?: string
  socialProofQuote?: string
  socialProofCount?: string
  socialProofWin?: string
}

/** Map kebab-case CLI flags to camelCase option keys. */
export const CLI_FLAG_ALIASES: Record<string, string> = {
  'research-layers': 'researchLayers',
  'research-tone': 'researchTone',
  'research-depth': 'researchDepth',
  'social-proof-result': 'socialProofResult',
  'social-proof-customer': 'socialProofCustomer',
  'social-proof-quote': 'socialProofQuote',
  'social-proof-count': 'socialProofCount',
  'social-proof-win': 'socialProofWin',
}

export function parseResearchLayers(value: string | undefined): ResearchLayer[] {
  if (!value?.trim()) {
    return ['ingredient', 'industry', 'behavioral']
  }

  const layers = value
    .split(',')
    .map((part) => part.trim())
    .filter((part): part is ResearchLayer =>
      (RESEARCH_LAYER_OPTIONS as readonly string[]).includes(part),
    )

  if (layers.length === 0) {
    console.error(
      `Invalid research layers. Choose from: ${RESEARCH_LAYER_OPTIONS.join(', ')}`,
    )
    process.exit(1)
  }

  return layers
}

export function parseResearchTone(value: string | undefined): ResearchTone {
  const tone = value?.trim() ?? 'clinical'
  if (!(RESEARCH_TONE_OPTIONS as readonly string[]).includes(tone)) {
    console.error(
      `Invalid research tone "${tone}". Choose: ${RESEARCH_TONE_OPTIONS.join(', ')}`,
    )
    process.exit(1)
  }
  return tone as ResearchTone
}

export function parseResearchDepth(value: string | undefined): ResearchDepth {
  const depth = value?.trim() ?? 'quick'
  if (!(RESEARCH_DEPTH_OPTIONS as readonly string[]).includes(depth)) {
    console.error(
      `Invalid research depth "${depth}". Choose: ${RESEARCH_DEPTH_OPTIONS.join(', ')}`,
    )
    process.exit(1)
  }
  return depth as ResearchDepth
}

export function buildResearchConfig(opts: ResearchCliOptions): SocialProofResearchConfig {
  return {
    layers: parseResearchLayers(opts.researchLayers),
    tone: parseResearchTone(opts.researchTone),
    depth: parseResearchDepth(opts.researchDepth),
  }
}

export function buildSocialProofAssetsFromCli(
  opts: ResearchCliOptions,
): SocialProofAssets | undefined {
  const assets: SocialProofAssets = {}

  if (opts.socialProofCustomer?.trim()) {
    assets.recognizableCustomer = opts.socialProofCustomer.trim()
  }
  if (opts.socialProofResult?.trim()) {
    assets.specificResult = opts.socialProofResult.trim()
  }
  if (opts.socialProofQuote?.trim()) {
    assets.customerQuote = opts.socialProofQuote.trim()
  }
  if (opts.socialProofCount?.trim()) {
    assets.customerCount = opts.socialProofCount.trim()
  }
  if (opts.socialProofWin?.trim()) {
    assets.recentWin = opts.socialProofWin.trim()
  }

  return Object.keys(assets).length > 0 ? assets : undefined
}

export function mergeSocialProofAssets(
  ...sources: Array<SocialProofAssets | undefined>
): SocialProofAssets | undefined {
  const merged: SocialProofAssets = {}

  for (const source of sources) {
    if (!source) continue
    if (source.recognizableCustomer?.trim()) {
      merged.recognizableCustomer = source.recognizableCustomer.trim()
    }
    if (source.specificResult?.trim()) {
      merged.specificResult = source.specificResult.trim()
    }
    if (source.customerQuote?.trim()) {
      merged.customerQuote = source.customerQuote.trim()
    }
    if (source.customerCount?.trim()) {
      merged.customerCount = source.customerCount.trim()
    }
    if (source.recentWin?.trim()) {
      merged.recentWin = source.recentWin.trim()
    }
  }

  return Object.keys(merged).length > 0 ? merged : undefined
}

export async function researchSocialProof(
  productDescription: string,
  config: SocialProofResearchConfig,
): Promise<SocialProofAssets> {
  return postJson<SocialProofAssets>('/api/research-social-proof', {
    productDescription,
    config,
  })
}

export async function resolveSocialProofAssets(
  productDescription: string,
  opts: ResearchCliOptions,
): Promise<SocialProofAssets | undefined> {
  const cliAssets = buildSocialProofAssetsFromCli(opts)

  if (!opts.research) {
    return cliAssets
  }

  const config = buildResearchConfig(opts)
  console.error(
    `Researching social proof (layers: ${config.layers.join(', ')}, tone: ${config.tone}, depth: ${config.depth})…`,
  )
  const researched = await researchSocialProof(productDescription, config)
  return mergeSocialProofAssets(researched, cliAssets)
}

export async function checkServer(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) throw new Error('not ok')
  } catch {
    console.error('Server not running — start with npm run dev first.')
    process.exit(1)
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed')
  }
  return data
}

export function buildContext(
  company: string,
  campaign: string,
  product: string,
  socialProofAssets?: SocialProofAssets,
): ColdContext {
  return {
    recipientName: 'there',
    recipientEmail: 'prospect@example.com',
    companyName: company,
    segmentAtSend: 'cold_prospect',
    sequenceNumber: 1,
    notes: `Campaign: ${campaign}\n\n${product}`,
    ...(socialProofAssets ? { socialProofAssets } : {}),
  }
}

export function formatOutput(
  draft: EmailDraft,
  levers: LeverSuggestion,
  styleLabel: string,
  scenarioLabel?: string,
): string {
  const lines = [
    ...(scenarioLabel ? [`SCENARIO:  ${scenarioLabel}`, ''] : []),
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `SUBJECT:    ${draft.subject}`,
  ]

  if (draft.preheader?.trim()) {
    lines.push(`PREHEADER:  ${draft.preheader}`)
  }

  lines.push(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    draft.body,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'LEVERS USED:',
    `  Intent:          ${levers.intent.value}`,
    `  Framework:       ${levers.copyStrategy.values.framework}`,
    `  Emotion:         ${levers.copyStrategy.values.emotion}`,
    `  Persuasion:      ${levers.copyStrategy.values.persuasion}`,
    `  Body length:     ${levers.body.values.length}`,
    `  Personalization: ${levers.copyStrategy.values.personalizationDepth}`,
    `  Social proof:    ${levers.socialProof.values.type}`,
    `  CTA type:        ${levers.cta.values.type}`,
    `  Style:           ${styleLabel}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  )

  return lines.join('\n')
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
