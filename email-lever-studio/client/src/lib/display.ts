import {
  CARD_DEFINITIONS,
  labelForIntent,
  labelForOption,
  type EmailDraft,
  type LeverSuggestion,
  type ResearchDepth,
  type ResearchLayer,
  type ResearchTone,
  type SocialProofAssets,
} from '../../../shared/schema.ts'
import { STYLE_AUTHOR_LABELS, type StyleKey } from '../../../shared/writing-styles.ts'

export type ResearchConfig = {
  layers: ResearchLayer[]
  tone: ResearchTone
  depth: ResearchDepth
}

export const DEFAULT_RESEARCH_CONFIG: ResearchConfig = {
  layers: ['ingredient', 'direct', 'company', 'origin'],
  tone: 'clinical',
  depth: 'full',
}

export const RESEARCH_LAYER_LABELS: Record<ResearchLayer, string> = {
  ingredient: 'Ingredient / Material / Technology',
  origin: 'Origin / Geography',
  industry: 'Industry / Market',
  behavioral: 'Behavioral / Social',
  expert: 'Expert / Authority',
  direct: 'Direct Product',
  company: 'Company / Brand',
}

const RESEARCH_LAYER_SHORT: Record<ResearchLayer, string> = {
  ingredient: 'Ingredient',
  origin: 'Origin',
  industry: 'Industry',
  behavioral: 'Behavioral',
  expert: 'Expert',
  direct: 'Direct Product',
  company: 'Company / Brand',
}

const RESEARCH_TONE_LABELS: Record<ResearchTone, string> = {
  clinical: 'Clinical',
  mass_market: 'Mass-market',
  luxury: 'Luxury',
  casual: 'Casual-friend',
}

const RESEARCH_DEPTH_LABELS: Record<ResearchDepth, string> = {
  quick: 'Quick',
  full: 'Full',
  fused: 'Fused',
}

export function formatResearchLayersChip(layers: ResearchLayer[]): string {
  return layers.map((layer) => RESEARCH_LAYER_SHORT[layer] ?? layer).join(' · ')
}

export type LeverChip = {
  label: string
  value: string
  primary: boolean
}

export type StrategyCard = {
  category: string
  tags: string[]
  reasoning: string
}

function fieldLabel(cardKey: string, fieldKey: string, value: string): string {
  const card = CARD_DEFINITIONS.find((c) => c.key === cardKey)
  const field = card?.fields.find((f) => f.key === fieldKey)
  if (field?.type === 'segmented') {
    return labelForOption(field.options, value)
  }
  return value
}

const BODY_LENGTH_LABELS: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
}

const PERSUASION_LABELS: Record<string, string> = {
  reciprocity: 'Reciprocity',
  authority: 'Authority',
  scarcity: 'Scarcity',
  liking: 'Liking',
  commitment: 'Commitment',
  none: 'None',
}

const CTA_TYPE_LABELS: Record<string, string> = {
  reply: 'Soft ask',
  book: 'Book',
  buy: 'Buy',
  read: 'Read',
  download: 'Download',
}

export function buildLeverChips(
  levers: LeverSuggestion,
  researchConfig: ResearchConfig = DEFAULT_RESEARCH_CONFIG,
  styleKey?: StyleKey,
): LeverChip[] {
  const cs = levers.copyStrategy.values
  const bodyLen = BODY_LENGTH_LABELS[levers.body.values.length] ?? levers.body.values.length
  const persuasion =
    cs.persuasion === 'none'
      ? 'Reciprocity'
      : (PERSUASION_LABELS[cs.persuasion] ?? cs.persuasion)
  const author = styleKey ? STYLE_AUTHOR_LABELS[styleKey] : 'David Ogilvy'

  return [
    { label: 'Intent', value: labelForIntent(levers.intent.value), primary: false },
    { label: 'Framework', value: cs.framework, primary: true },
    {
      label: 'Emotion',
      value: fieldLabel('copyStrategy', 'emotion', cs.emotion),
      primary: false,
    },
    {
      label: 'Persuasion',
      value: persuasion,
      primary: false,
    },
    { label: 'Body length', value: bodyLen, primary: false },
    {
      label: 'Personalization',
      value: fieldLabel('copyStrategy', 'personalizationDepth', cs.personalizationDepth),
      primary: false,
    },
    {
      label: 'Social proof',
      value: formatResearchLayersChip(researchConfig.layers),
      primary: true,
    },
    {
      label: 'CTA type',
      value: CTA_TYPE_LABELS[levers.cta.values.type] ?? levers.cta.values.type,
      primary: false,
    },
    { label: 'Author', value: author, primary: true },
  ]
}

function persuasionLabel(persuasion: string): string {
  if (persuasion === 'none') return 'Reciprocity'
  return PERSUASION_LABELS[persuasion] ?? persuasion
}

export function buildStrategyCards(
  levers: LeverSuggestion,
  researchConfig: ResearchConfig = DEFAULT_RESEARCH_CONFIG,
  styleKey?: StyleKey,
): StrategyCard[] {
  const cs = levers.copyStrategy.values
  const ct = levers.cta.values
  const author = styleKey ? STYLE_AUTHOR_LABELS[styleKey] : 'David Ogilvy'

  return [
    {
      category: 'Copy Strategy',
      tags: [
        `${cs.framework} Framework`,
        fieldLabel('copyStrategy', 'emotion', cs.emotion),
        persuasionLabel(cs.persuasion),
      ],
      reasoning: levers.copyStrategy.reasoning,
    },
    {
      category: 'Writing Style',
      tags: [author, styleKey ? `${styleKey} voice` : 'ogilvy voice'],
      reasoning: `Email written in the voice and structure of ${author}.`,
    },
    {
      category: 'Social Proof',
      tags: [
        ...researchConfig.layers.map((layer) => RESEARCH_LAYER_LABELS[layer]),
        `${RESEARCH_TONE_LABELS[researchConfig.tone]} tone`,
        `${RESEARCH_DEPTH_LABELS[researchConfig.depth]} depth`,
      ],
      reasoning: levers.socialProof.reasoning,
    },
    {
      category: 'CTA',
      tags: [
        CTA_TYPE_LABELS[ct.type] ?? ct.type,
        fieldLabel('cta', 'style', ct.style),
        levers.cta.ctaCopy,
      ].filter(Boolean),
      reasoning: levers.cta.reasoning,
    },
  ]
}

export function buildProofFacts(assets: SocialProofAssets): string[] {
  return [
    assets.recognizableCustomer,
    assets.specificResult,
    assets.customerQuote,
    assets.customerCount,
    assets.recentWin,
  ].filter((fact): fact is string => Boolean(fact?.trim()))
}

export function formatEmailForCopy(draft: EmailDraft): string {
  const parts = [`Subject: ${draft.subject}`]
  if (draft.preheader?.trim()) {
    parts.push('', draft.preheader.trim())
  }
  parts.push('', draft.body)
  return parts.join('\n')
}
