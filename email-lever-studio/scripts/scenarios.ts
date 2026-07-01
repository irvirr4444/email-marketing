import {
  cloneLeverSuggestion,
  type BodyValues,
  type CopyStrategyValues,
  type CtaValues,
  type IntentValue,
  type LeverSuggestion,
  type OfferValues,
  type PreheaderValues,
  type SocialProofValues,
  type SubjectLineValues,
} from '../shared/schema.ts'
import type { StyleKey } from './writing-styles.ts'
import { WRITING_STYLES } from './writing-styles.ts'

export type StyleChoice = StyleKey | 'none'

export type LeverPatch = {
  intent?: IntentValue
  subjectLine?: Partial<SubjectLineValues>
  preheader?: Partial<PreheaderValues>
  body?: Partial<BodyValues>
  copyStrategy?: Partial<CopyStrategyValues>
  socialProof?: Partial<SocialProofValues>
  cta?: Partial<CtaValues> & { ctaCopy?: string }
  offer?: Partial<OfferValues>
}

export type Scenario = {
  id: string
  label: string
  style: StyleChoice
  levers: LeverPatch
}

export function applyScenarioToLevers(
  base: LeverSuggestion,
  patch: LeverPatch,
): LeverSuggestion {
  const levers = cloneLeverSuggestion(base)

  if (patch.intent) {
    levers.intent.value = patch.intent
    levers.intent.reasoning = `Batch scenario override: ${patch.intent}.`
  }
  if (patch.subjectLine) {
    levers.subjectLine.values = { ...levers.subjectLine.values, ...patch.subjectLine }
  }
  if (patch.preheader) {
    levers.preheader.values = { ...levers.preheader.values, ...patch.preheader }
  }
  if (patch.body) {
    levers.body.values = { ...levers.body.values, ...patch.body }
  }
  if (patch.copyStrategy) {
    levers.copyStrategy.values = {
      ...levers.copyStrategy.values,
      ...patch.copyStrategy,
    }
  }
  if (patch.socialProof) {
    levers.socialProof.values = {
      ...levers.socialProof.values,
      ...patch.socialProof,
    }
  }
  if (patch.cta) {
    const { ctaCopy, ...ctaValues } = patch.cta
    if (Object.keys(ctaValues).length > 0) {
      levers.cta.values = { ...levers.cta.values, ...ctaValues }
    }
    if (ctaCopy) levers.cta.ctaCopy = ctaCopy
  }
  if (patch.offer) {
    levers.offer.values = { ...levers.offer.values, ...patch.offer }
  }

  return levers
}

/** Curated cold-outreach scenarios — distinct lever + style pairings. */
export const CURATED_SCENARIOS: Scenario[] = [
  {
    id: 'pas-curiosity-kern',
    label: 'PAS + curiosity + Kern',
    style: 'kern',
    levers: {
      copyStrategy: { framework: 'PAS', emotion: 'curiosity', persuasion: 'none' },
    },
  },
  {
    id: 'pas-pain-kennedy',
    label: 'PAS + pain_relief + Kennedy',
    style: 'kennedy',
    levers: {
      copyStrategy: { framework: 'PAS', emotion: 'pain_relief', persuasion: 'scarcity' },
      subjectLine: { type: 'question', length: 'short' },
    },
  },
  {
    id: 'aida-aspiration-ogilvy',
    label: 'AIDA + aspiration + Ogilvy',
    style: 'ogilvy',
    levers: {
      copyStrategy: {
        framework: 'AIDA',
        emotion: 'aspiration',
        persuasion: 'authority',
        specificity: 'hard_numbers',
      },
      subjectLine: { type: 'statement', casing: 'title' },
    },
  },
  {
    id: 'bab-fomo-chaperon',
    label: 'BAB + FOMO + Chaperon',
    style: 'chaperon',
    levers: {
      copyStrategy: { framework: 'BAB', emotion: 'fomo', persuasion: 'commitment' },
      body: { length: 'medium' },
    },
  },
  {
    id: 'fab-status-none',
    label: 'FAB + status, no author style',
    style: 'none',
    levers: {
      copyStrategy: { framework: 'FAB', emotion: 'status', persuasion: 'authority' },
      body: { length: 'medium', scannable: true },
      subjectLine: { type: 'list', numberIncluded: true },
    },
  },
  {
    id: 'pas-fear-kennedy',
    label: 'PAS + fear + Kennedy',
    style: 'kennedy',
    levers: {
      intent: 'book_meeting',
      copyStrategy: { framework: 'PAS', emotion: 'fear', persuasion: 'scarcity' },
      cta: { type: 'book', style: 'link', ctaCopy: 'Worth 15 minutes this week?' },
      body: { linkCount: 'one' },
    },
  },
  {
    id: 'none-humor-kern',
    label: 'No framework + humor + Kern',
    style: 'kern',
    levers: {
      copyStrategy: { framework: 'none', emotion: 'humor', persuasion: 'liking' },
      subjectLine: { type: 'curiosity_gap', casing: 'lowercase' },
    },
  },
  {
    id: 'pas-reciprocity-ogilvy',
    label: 'PAS + reciprocity + Ogilvy',
    style: 'ogilvy',
    levers: {
      copyStrategy: {
        framework: 'PAS',
        emotion: 'pain_relief',
        persuasion: 'reciprocity',
        personalizationDepth: 'segment_tailored',
      },
      body: { length: 'short' },
    },
  },
  {
    id: 'aida-curiosity-chaperon',
    label: 'AIDA + curiosity + Chaperon',
    style: 'chaperon',
    levers: {
      copyStrategy: { framework: 'AIDA', emotion: 'curiosity', persuasion: 'none' },
      body: { length: 'long' },
      preheader: { present: true, relationship: 'complements' },
    },
  },
  {
    id: 'bab-aspiration-kern',
    label: 'BAB + aspiration + Kern',
    style: 'kern',
    levers: {
      intent: 'get_reply',
      copyStrategy: { framework: 'BAB', emotion: 'aspiration', persuasion: 'liking' },
    },
  },
  {
    id: 'pas-authority-ogilvy',
    label: 'PAS + authority + Ogilvy',
    style: 'ogilvy',
    levers: {
      copyStrategy: {
        framework: 'PAS',
        emotion: 'pain_relief',
        persuasion: 'authority',
        specificity: 'hard_numbers',
      },
      socialProof: { type: 'peer', placement: 'pre_cta', specificity: 'vague' },
    },
  },
  {
    id: 'aida-fomo-kennedy',
    label: 'AIDA + FOMO + Kennedy',
    style: 'kennedy',
    levers: {
      intent: 'drive_purchase',
      copyStrategy: { framework: 'AIDA', emotion: 'fomo', persuasion: 'scarcity' },
      offer: { hasOffer: true, type: 'free_trial', scarcity: 'time_limited', magnitude: '14 days' },
      cta: { type: 'buy', style: 'link', ctaCopy: 'Start your free trial →' },
      body: { linkCount: 'one' },
    },
  },
]

const MATRIX_FRAMEWORKS = ['PAS', 'AIDA', 'BAB', 'FAB'] as const
const MATRIX_EMOTIONS = ['curiosity', 'pain_relief', 'aspiration', 'fear'] as const
const MATRIX_STYLES: StyleChoice[] = ['kennedy', 'ogilvy', 'kern', 'chaperon', 'none']

export function buildMatrixScenarios(): Scenario[] {
  const scenarios: Scenario[] = []

  for (const framework of MATRIX_FRAMEWORKS) {
    for (const emotion of MATRIX_EMOTIONS) {
      for (const style of MATRIX_STYLES) {
        const id = `${framework.toLowerCase()}-${emotion}-${style}`
        scenarios.push({
          id,
          label: `${framework} + ${emotion} + ${style}`,
          style,
          levers: {
            copyStrategy: { framework, emotion, persuasion: 'none' },
          },
        })
      }
    }
  }

  return scenarios
}

export function resolveStyleText(style: StyleChoice): string | undefined {
  if (style === 'none') return undefined
  return WRITING_STYLES[style]
}

const D50_INTENTS = [
  'get_reply',
  'drive_purchase',
  'click_to_page',
  'collect_info',
  'drive_purchase',
] as const
const D50_FRAMEWORKS = ['PAS', 'AIDA', 'BAB', 'FAB', 'none'] as const
const D50_EMOTIONS = [
  'curiosity',
  'aspiration',
  'pain_relief',
  'fomo',
  'status',
  'fear',
  'humor',
] as const
const D50_PERSUASIONS = [
  'none',
  'authority',
  'reciprocity',
  'liking',
  'scarcity',
  'commitment',
] as const
const D50_STYLES: StyleChoice[] = ['kennedy', 'ogilvy', 'kern', 'chaperon', 'none']

/** 50 scenarios with broad lever coverage (framework, emotion, persuasion, style, subject, CTA, social proof). */
export function buildDiverse50Scenarios(): Scenario[] {
  const scenarios: Scenario[] = []

  for (let i = 0; i < 50; i++) {
    const framework = D50_FRAMEWORKS[i % D50_FRAMEWORKS.length]!
    const emotion = D50_EMOTIONS[i % D50_EMOTIONS.length]!
    const persuasion = D50_PERSUASIONS[i % D50_PERSUASIONS.length]!
    const style = D50_STYLES[i % D50_STYLES.length]!
    const intent = D50_INTENTS[i % D50_INTENTS.length]!
    const id = `d50-${String(i + 1).padStart(2, '0')}-${framework.toLowerCase()}-${emotion}-${style}`

    const ctaOptions = [
      { type: 'reply' as const, style: 'plain_reply_ask' as const, ctaCopy: 'Curious if this is something you would try?' },
      { type: 'buy' as const, style: 'link' as const, ctaCopy: 'Shop now →' },
      { type: 'read' as const, style: 'link' as const, ctaCopy: 'Read more →' },
      { type: 'download' as const, style: 'link' as const, ctaCopy: 'Get the guide →' },
    ]
    const ctaPatch = { ...ctaOptions[i % ctaOptions.length]! }
    const bodyPatch = {
      length: (['short', 'medium', 'long'] as const)[i % 3]!,
      scannable: i % 3 !== 0,
      linkCount: ctaPatch.type === 'reply' ? ('zero' as const) : ('one' as const),
    }

    scenarios.push({
      id,
      label: `#${i + 1} ${framework} + ${emotion} + ${persuasion} + ${style}`,
      style,
      levers: {
        intent,
        copyStrategy: {
          framework,
          emotion,
          persuasion,
          specificity: i % 2 === 0 ? 'hard_numbers' : 'vague',
          personalizationDepth: (['merge_field', 'segment_tailored', 'generic', 'one_to_one_researched'] as const)[
            i % 4
          ]!,
        },
        subjectLine: (
          [
            { type: 'question', length: 'short', casing: 'sentence' },
            { type: 'statement', length: 'medium', casing: 'title' },
            { type: 'curiosity_gap', length: 'short', casing: 'lowercase' },
            { type: 'list', length: 'medium', numberIncluded: true },
            { type: 'announcement', length: 'short', urgency: false },
          ] as const
        )[i % 5],
        preheader: (
          [
            { present: false },
            { present: true, length: 'short', relationship: 'complements' },
            { present: true, length: 'medium', relationship: 'repeats' },
          ] as const
        )[i % 3],
        body: bodyPatch,
        socialProof: (
          [
            { type: 'none', specificity: 'vague' },
            { type: 'peer', placement: 'body', specificity: 'vague' },
            { type: 'result', placement: 'pre_cta', specificity: 'specific' },
            { type: 'volume', placement: 'opener', specificity: 'specific' },
            { type: 'consensus', placement: 'body', specificity: 'vague' },
            { type: 'recency', placement: 'ps', specificity: 'specific' },
          ] as const
        )[i % 6],
        cta: {
          ...ctaPatch,
          count: i % 7 === 0 ? 'two' : 'one',
          placement: i % 3 === 0 ? 'both' : i % 3 === 1 ? 'end' : 'inline',
        },
        offer:
          i % 10 === 0
            ? {
                hasOffer: true,
                type: 'percent_off',
                magnitude: '15% off first order',
                scarcity: 'time_limited',
              }
            : undefined,
      },
    })
  }

  return scenarios
}

export function listScenarios(opts: {
  matrix: boolean
  diverse50?: boolean
  limit?: number
}): Scenario[] {
  const all = opts.diverse50
    ? buildDiverse50Scenarios()
    : opts.matrix
      ? buildMatrixScenarios()
      : CURATED_SCENARIOS
  if (opts.limit && opts.limit > 0) {
    return all.slice(0, opts.limit)
  }
  return all
}
