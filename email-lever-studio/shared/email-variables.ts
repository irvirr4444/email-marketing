import type { StyleKey } from './writing-styles.ts'
import { STYLE_AUTHOR_LABELS } from './writing-styles.ts'
import {
  INTENT_OPTIONS,
  labelForIntent,
  type LeverSuggestion,
} from './schema.ts'

/** Flat lever snapshot aligned with generated_email columns and leverSummary(). */
export type EmailVariableSnapshot = {
  intent: string
  framework: string
  emotion: string
  persuasion: string
  specificity: string
  personalization: string
  writingStyle: string | null
  subjectType: string
  subjectLength: string
  subjectCasing: string
  preheaderPresent: boolean
  preheaderLength: string | null
  preheaderRelationship: string | null
  bodyLength: string
  bodyLinks: string
  bodyScannable: boolean
  socialProofType: string
  socialProofPlacement: string | null
  socialProofSpecificity: string | null
  ctaType: string
  ctaStyle: string
  ctaPlacement: string
  ctaCopy: string
  hasOffer: boolean
  offerType: string | null
  offerMagnitude: string | null
}

export type VariableSectionKey = keyof EmailVariableSnapshot | 'preheader' | 'offer'

export type VariableSection = {
  id: string
  label: string
  fields: { key: VariableSectionKey; label: string; primary?: boolean }[]
}

export const VARIABLE_SECTIONS: VariableSection[] = [
  {
    id: 'copyStrategy',
    label: 'Copy Strategy',
    fields: [
      { key: 'intent', label: 'Intent', primary: true },
      { key: 'framework', label: 'Framework', primary: true },
      { key: 'emotion', label: 'Emotion' },
      { key: 'persuasion', label: 'Persuasion' },
      { key: 'specificity', label: 'Specificity' },
      { key: 'personalization', label: 'Personalization' },
    ],
  },
  {
    id: 'writingStyle',
    label: 'Writing Style',
    fields: [{ key: 'writingStyle', label: 'Author', primary: true }],
  },
  {
    id: 'subjectLine',
    label: 'Subject Line',
    fields: [
      { key: 'subjectType', label: 'Type' },
      { key: 'subjectLength', label: 'Length' },
      { key: 'subjectCasing', label: 'Casing' },
    ],
  },
  {
    id: 'preheader',
    label: 'Preheader',
    fields: [{ key: 'preheader', label: 'Preheader' }],
  },
  {
    id: 'body',
    label: 'Body',
    fields: [
      { key: 'bodyLength', label: 'Length' },
      { key: 'bodyLinks', label: 'Links' },
      { key: 'bodyScannable', label: 'Scannable' },
    ],
  },
  {
    id: 'socialProof',
    label: 'Social Proof',
    fields: [
      { key: 'socialProofType', label: 'Type' },
      { key: 'socialProofPlacement', label: 'Placement' },
      { key: 'socialProofSpecificity', label: 'Specificity' },
    ],
  },
  {
    id: 'cta',
    label: 'CTA',
    fields: [
      { key: 'ctaType', label: 'Type', primary: true },
      { key: 'ctaStyle', label: 'Style' },
      { key: 'ctaPlacement', label: 'Placement' },
      { key: 'ctaCopy', label: 'Copy' },
    ],
  },
  {
    id: 'offer',
    label: 'Offer',
    fields: [{ key: 'offer', label: 'Offer' }],
  },
]

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

const BODY_LENGTH_LABELS: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  long: 'Long',
}

const EMOTION_LABELS: Record<string, string> = {
  fear: 'Fear',
  aspiration: 'Aspiration',
  curiosity: 'Curiosity',
  humor: 'Humor',
  fomo: 'FOMO',
  status: 'Status',
  pain_relief: 'Pain relief',
}

const PERSONALIZATION_LABELS: Record<string, string> = {
  generic: 'Generic',
  merge_field: 'Merge field',
  segment_tailored: 'Segment tailored',
  one_to_one_researched: '1:1 researched',
}

const SPECIFICITY_LABELS: Record<string, string> = {
  hard_numbers: 'Hard numbers',
  vague: 'Vague',
}

const SP_TYPE_LABELS: Record<string, string> = {
  none: 'None',
  volume: 'Volume',
  name_drop: 'Name drop',
  peer: 'Peer',
  result: 'Result',
  quote: 'Quote',
  recency: 'Recency',
  consensus: 'Consensus',
}

/** Legacy leverSummary shape for docx export and manifests. */
export function leverSummary(levers: LeverSuggestion): Record<string, string> {
  const sl = levers.subjectLine.values
  const ph = levers.preheader.values
  const bd = levers.body.values
  const cs = levers.copyStrategy.values
  const sp = levers.socialProof.values
  const ct = levers.cta.values
  const of = levers.offer.values

  return {
    Intent: levers.intent.value,
    Framework: cs.framework,
    Emotion: cs.emotion,
    Persuasion: cs.persuasion,
    Specificity: cs.specificity,
    Personalization: cs.personalizationDepth,
    'Subject type': sl.type,
    'Subject length': sl.length,
    'Subject casing': sl.casing,
    Preheader: ph.present ? `${ph.length}, ${ph.relationship}` : 'omit',
    'Body length': bd.length,
    'Body links': bd.linkCount,
    Scannable: String(bd.scannable),
    'Social proof': sp.type,
    'SP placement': sp.type === 'none' ? '—' : sp.placement,
    'SP specificity': sp.type === 'none' ? '—' : sp.specificity,
    'CTA type': ct.type,
    'CTA style': ct.style,
    'CTA placement': ct.placement,
    'CTA copy': levers.cta.ctaCopy,
    Offer: of.hasOffer ? `${of.type} ${of.magnitude}` : 'none',
  }
}

export function fromLeverSuggestion(
  levers: LeverSuggestion,
  styleKey?: StyleKey | null,
): EmailVariableSnapshot {
  const sl = levers.subjectLine.values
  const ph = levers.preheader.values
  const bd = levers.body.values
  const cs = levers.copyStrategy.values
  const sp = levers.socialProof.values
  const ct = levers.cta.values
  const of = levers.offer.values

  return {
    intent: levers.intent.value,
    framework: cs.framework,
    emotion: cs.emotion,
    persuasion: cs.persuasion,
    specificity: cs.specificity,
    personalization: cs.personalizationDepth,
    writingStyle: styleKey ? STYLE_AUTHOR_LABELS[styleKey] : null,
    subjectType: sl.type,
    subjectLength: sl.length,
    subjectCasing: sl.casing,
    preheaderPresent: ph.present,
    preheaderLength: ph.present ? ph.length : null,
    preheaderRelationship: ph.present ? ph.relationship : null,
    bodyLength: bd.length,
    bodyLinks: bd.linkCount,
    bodyScannable: bd.scannable,
    socialProofType: sp.type,
    socialProofPlacement: sp.type === 'none' ? null : sp.placement,
    socialProofSpecificity: sp.type === 'none' ? null : sp.specificity,
    ctaType: ct.type,
    ctaStyle: ct.style,
    ctaPlacement: ct.placement,
    ctaCopy: levers.cta.ctaCopy,
    hasOffer: of.hasOffer,
    offerType: of.hasOffer ? of.type : null,
    offerMagnitude: of.hasOffer ? of.magnitude : null,
  }
}

/** Map a generated_email DB row into EmailVariableSnapshot. */
export function fromGeneratedEmailRow(row: {
  intent: string
  framework?: string | null
  emotion?: string | null
  persuasion?: string | null
  specificity?: string | null
  personalization_depth?: string | null
  writing_style?: string | null
  subject_type?: string | null
  subject_length?: string | null
  subject_casing?: string | null
  preheader_present?: boolean | null
  preheader_length?: string | null
  preheader_relationship?: string | null
  body_length?: string | null
  body_links?: string | null
  body_scannable?: boolean | null
  social_proof_type?: string | null
  social_proof_placement?: string | null
  social_proof_specificity?: string | null
  cta_type?: string | null
  cta_style?: string | null
  cta_placement?: string | null
  cta_copy?: string | null
  has_offer?: boolean | null
  offer_type?: string | null
  offer_magnitude?: string | null
}): EmailVariableSnapshot {
  const spType = row.social_proof_type ?? 'none'
  return {
    intent: row.intent,
    framework: row.framework ?? 'none',
    emotion: row.emotion ?? 'curiosity',
    persuasion: row.persuasion ?? 'reciprocity',
    specificity: row.specificity ?? 'vague',
    personalization: row.personalization_depth ?? 'generic',
    writingStyle: row.writing_style ?? null,
    subjectType: row.subject_type ?? 'statement',
    subjectLength: row.subject_length ?? 'medium',
    subjectCasing: row.subject_casing ?? 'sentence',
    preheaderPresent: row.preheader_present ?? false,
    preheaderLength: row.preheader_length ?? null,
    preheaderRelationship: row.preheader_relationship ?? null,
    bodyLength: row.body_length ?? 'medium',
    bodyLinks: row.body_links ?? 'zero',
    bodyScannable: row.body_scannable ?? true,
    socialProofType: spType,
    socialProofPlacement: spType === 'none' ? null : row.social_proof_placement ?? null,
    socialProofSpecificity:
      spType === 'none' ? null : row.social_proof_specificity ?? null,
    ctaType: row.cta_type ?? 'reply',
    ctaStyle: row.cta_style ?? 'plain_reply_ask',
    ctaPlacement: row.cta_placement ?? 'end',
    ctaCopy: row.cta_copy ?? '',
    hasOffer: row.has_offer ?? false,
    offerType: row.has_offer ? row.offer_type ?? null : null,
    offerMagnitude: row.has_offer ? row.offer_magnitude ?? null : null,
  }
}

export function getVariableDisplayValue(
  snapshot: EmailVariableSnapshot,
  key: VariableSectionKey,
): string | null {
  if (key === 'preheader') {
    if (!snapshot.preheaderPresent) return null
    return `${snapshot.preheaderLength}, ${snapshot.preheaderRelationship}`
  }
  if (key === 'offer') {
    if (!snapshot.hasOffer) return null
    return [snapshot.offerType, snapshot.offerMagnitude].filter(Boolean).join(' ')
  }
  if (key === 'writingStyle') {
    return snapshot.writingStyle
  }
  if (key === 'bodyScannable') {
    return snapshot.bodyScannable ? 'Yes' : 'No'
  }

  const raw = snapshot[key as keyof EmailVariableSnapshot]
  if (raw === null || raw === undefined || raw === '') return null
  if (typeof raw === 'boolean') return raw ? 'Yes' : 'No'
  if (raw === 'none' || raw === '—') return null

  return formatVariableValue(key as keyof EmailVariableSnapshot, String(raw))
}

export function formatVariableValue(
  key: keyof EmailVariableSnapshot,
  value: string,
): string {
  switch (key) {
    case 'intent':
      return labelForIntent(value as Parameters<typeof labelForIntent>[0])
    case 'persuasion':
      return PERSUASION_LABELS[value] ?? value
    case 'ctaType':
      return CTA_TYPE_LABELS[value] ?? value
    case 'bodyLength':
      return BODY_LENGTH_LABELS[value] ?? value
    case 'emotion':
      return EMOTION_LABELS[value] ?? value
    case 'personalization':
      return PERSONALIZATION_LABELS[value] ?? value
    case 'specificity':
      return SPECIFICITY_LABELS[value] ?? value
    case 'socialProofType':
      return SP_TYPE_LABELS[value] ?? value
    default:
      return value.replace(/_/g, ' ')
  }
}

export function getVisibleVariableSections(snapshot: EmailVariableSnapshot) {
  return VARIABLE_SECTIONS.map((section) => ({
    ...section,
    items: section.fields
      .map((field) => {
        const value = getVariableDisplayValue(snapshot, field.key)
        if (!value) return null
        return { ...field, value }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  })).filter((section) => section.items.length > 0)
}

/** Filter option helpers for dashboard. */
export const FILTER_INTENT_OPTIONS = INTENT_OPTIONS

export const FILTER_CTA_TYPE_OPTIONS = [
  { value: 'reply', label: 'Soft ask' },
  { value: 'book', label: 'Book' },
  { value: 'buy', label: 'Buy' },
  { value: 'read', label: 'Read' },
  { value: 'download', label: 'Download' },
] as const

export const FILTER_EMOTION_OPTIONS = Object.entries(EMOTION_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const FILTER_PERSUASION_OPTIONS = Object.entries(PERSUASION_LABELS)
  .filter(([value]) => value !== 'none')
  .map(([value, label]) => ({ value, label }))

export const FILTER_SPECIFICITY_OPTIONS = Object.entries(SPECIFICITY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const FILTER_PERSONALIZATION_OPTIONS = Object.entries(
  PERSONALIZATION_LABELS,
).map(([value, label]) => ({ value, label }))

export const FILTER_SP_TYPE_OPTIONS = Object.entries(SP_TYPE_LABELS)
  .filter(([value]) => value !== 'none')
  .map(([value, label]) => ({ value, label }))

export const FILTER_BODY_LENGTH_OPTIONS = Object.entries(BODY_LENGTH_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const FILTER_WRITING_STYLE_OPTIONS = Object.values(STYLE_AUTHOR_LABELS).map(
  (label) => ({ value: label, label }),
)

export const FILTER_HAS_OFFER_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'yes', label: 'Has offer' },
  { value: 'no', label: 'No offer' },
] as const
