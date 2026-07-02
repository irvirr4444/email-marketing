import type { CopyStrategyValues, LeverSuggestion, SocialProofAssets } from './schema.ts'
import { hasSocialProofAssets } from './schema.ts'
import {
  resolveStyle,
  STYLE_AUTHOR_LABELS,
  type StyleKey,
  WRITING_STYLES,
} from './writing-styles.ts'

type PersuasionValue = CopyStrategyValues['persuasion']

const PERSUASION_OPTIONS: Exclude<PersuasionValue, 'none'>[] = [
  'authority',
  'reciprocity',
  'scarcity',
  'liking',
  'commitment',
]

const PERSUASION_TO_STYLES: Record<Exclude<PersuasionValue, 'none'>, StyleKey[]> = {
  authority: ['ogilvy', 'bencivenga', 'schwartz'],
  reciprocity: ['kern', 'settle', 'brunson'],
  scarcity: ['kennedy', 'halbert', 'makepeace'],
  liking: ['kern', 'carlton', 'settle'],
  commitment: ['chaperon', 'albuquerque', 'brunson'],
}

const ALL_STYLE_KEYS = Object.keys(WRITING_STYLES) as StyleKey[]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function applyPersuasionDefault(
  levers: LeverSuggestion,
  assets: SocialProofAssets | undefined,
): PersuasionValue {
  if (levers.copyStrategy.values.persuasion !== 'none') {
    return levers.copyStrategy.values.persuasion
  }

  const persuasion = pickRandom(PERSUASION_OPTIONS)

  levers.copyStrategy.values.persuasion = persuasion
  levers.copyStrategy.reasoning =
    levers.copyStrategy.reasoning?.trim() ||
    `Selected ${persuasion} persuasion for cold outreach${hasSocialProofAssets(assets) ? ' with researched proof' : ''}.`

  return persuasion
}

export function pickStyleForPersuasion(persuasion: PersuasionValue): StyleKey {
  if (persuasion === 'none') return pickRandom(ALL_STYLE_KEYS)
  const options = PERSUASION_TO_STYLES[persuasion]
  return pickRandom(options)
}

export type GenerationDefaults = {
  styleKey: StyleKey
  styleText: string
  styleAuthor: string
}

export function applyGenerationDefaults(
  levers: LeverSuggestion,
  assets: SocialProofAssets | undefined,
): GenerationDefaults {
  const persuasion = applyPersuasionDefault(levers, assets)
  const styleKey = pickStyleForPersuasion(persuasion)
  const style = resolveStyle(styleKey)

  return {
    styleKey: style.key,
    styleText: style.text,
    styleAuthor: style.author,
  }
}

export function authorLabelForStyle(styleKey: StyleKey): string {
  return STYLE_AUTHOR_LABELS[styleKey]
}

export function styleTextForKey(styleKey: StyleKey): string {
  return WRITING_STYLES[styleKey]
}
