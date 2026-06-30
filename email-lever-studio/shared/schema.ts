// Single source of truth for ColdContext, lever taxonomy, defaults, and OpenAI JSON schema.

export const CUSTOMER_SEGMENT_OPTIONS = [
  'cold_prospect',
  'warm_lead',
  'trial_active',
  'trial_expiring',
  'first_time_buyer',
  'repeat',
  'vip',
  'churned',
  'win_back',
  'referral_source',
  'partner_affiliate',
  'investor_advisor',
] as const

export type CustomerSegment = (typeof CUSTOMER_SEGMENT_OPTIONS)[number]

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  cold_prospect: 'Cold Prospect',
  warm_lead: 'Warm Lead',
  trial_active: 'Trial Active',
  trial_expiring: 'Trial Expiring',
  first_time_buyer: 'First-Time Buyer',
  repeat: 'Repeat',
  vip: 'VIP',
  churned: 'Churned',
  win_back: 'Win-Back',
  referral_source: 'Referral Source',
  partner_affiliate: 'Partner / Affiliate',
  investor_advisor: 'Investor / Advisor',
}

export function labelForSegment(value: CustomerSegment): string {
  return SEGMENT_LABELS[value] ?? value
}

export type ColdContext = {
  recipientName: string
  recipientEmail: string
  companyName?: string
  industry?: string
  role?: string
  seniority?: string
  companySize?: string
  country?: string
  language?: string
  notes?: string
  segmentAtSend: CustomerSegment
  sequenceNumber: 1
}

export type IntentValue =
  | 'book_meeting'
  | 'drive_purchase'
  | 'get_reply'
  | 'click_to_page'
  | 'collect_info'
  | 'referral'

export type SubjectLineValues = {
  length: 'short' | 'medium' | 'long'
  personalizationToken: boolean
  type: 'question' | 'statement' | 'curiosity_gap' | 'list' | 'announcement'
  urgency: boolean
  numberIncluded: boolean
  emoji: boolean
  casing: 'sentence' | 'title' | 'lowercase'
}

export type PreheaderValues = {
  present: boolean
  length: 'short' | 'medium'
  relationship: 'complements' | 'repeats'
}

export type SenderValues = {
  nameType: 'personal' | 'company' | 'hybrid'
  replyToSet: boolean
}

export type BodyValues = {
  length: 'short' | 'medium' | 'long'
  format: 'plain' | 'html'
  linkCount: 'zero' | 'one' | 'two_plus'
  readingLevel: 'simple' | 'moderate' | 'advanced'
  scannable: boolean
}

export type CopyStrategyValues = {
  framework: 'AIDA' | 'PAS' | 'BAB' | 'FAB' | 'none'
  persuasion:
    | 'reciprocity'
    | 'social_proof'
    | 'authority'
    | 'scarcity'
    | 'liking'
    | 'commitment'
    | 'none'
  emotion:
    | 'fear'
    | 'aspiration'
    | 'curiosity'
    | 'humor'
    | 'fomo'
    | 'status'
    | 'pain_relief'
  specificity: 'hard_numbers' | 'vague'
  personalizationDepth:
    | 'generic'
    | 'merge_field'
    | 'segment_tailored'
    | 'one_to_one_researched'
}

export type CtaValues = {
  count: 'one' | 'two'
  type: 'reply' | 'book' | 'buy' | 'read' | 'download'
  placement: 'inline' | 'end' | 'both'
  style: 'button' | 'link' | 'plain_reply_ask'
}

export type OfferValues = {
  hasOffer: boolean
  type:
    | 'percent_off'
    | 'dollar_off'
    | 'free_trial'
    | 'bonus'
    | 'bundle'
    | 'guarantee'
  magnitude: string
  scarcity: 'none' | 'time_limited' | 'quantity_limited'
}

export type LeverCardBase = {
  reasoning: string
  locked: boolean
}

export type IntentLever = LeverCardBase & {
  value: IntentValue
}

export type LeverSuggestion = {
  intent: IntentLever
  subjectLine: LeverCardBase & { values: SubjectLineValues }
  preheader: LeverCardBase & { values: PreheaderValues }
  sender: LeverCardBase & { values: SenderValues }
  body: LeverCardBase & { values: BodyValues }
  copyStrategy: LeverCardBase & { values: CopyStrategyValues }
  cta: LeverCardBase & { values: CtaValues; ctaCopy: string }
  offer: LeverCardBase & { values: OfferValues }
}

export type EmailDraft = {
  subject: string
  preheader?: string
  body: string
}

export type CardKey = keyof Omit<LeverSuggestion, 'intent'>

export type OptionDef = { value: string; label: string }

export type FieldDef = (
  | {
      key: string
      label: string
      type: 'segmented'
      options: OptionDef[]
    }
  | { key: string; label: string; type: 'toggle' }
  | { key: string; label: string; type: 'text' }
) & {
  hiddenWhen?: { field: string; equals: boolean | string }
}

export type CardDef = {
  key: CardKey
  label: string
  fields: FieldDef[]
}

// --- Display labels ---

export const INTENT_OPTIONS: OptionDef[] = [
  { value: 'book_meeting', label: 'Book Meeting' },
  { value: 'drive_purchase', label: 'Drive Purchase' },
  { value: 'get_reply', label: 'Get Reply' },
  { value: 'click_to_page', label: 'Click to Page' },
  { value: 'collect_info', label: 'Collect Info' },
  { value: 'referral', label: 'Referral' },
]

export const SENIORITY_OPTIONS = [
  'IC',
  'Manager',
  'Director',
  'VP/C-level',
] as const

export const COMPANY_SIZE_OPTIONS = [
  '1-10',
  '11-50',
  '51-200',
  '200+',
] as const

export const CARD_DEFINITIONS: CardDef[] = [
  {
    key: 'subjectLine',
    label: 'Subject Line',
    fields: [
      {
        key: 'length',
        label: 'Length',
        type: 'segmented',
        options: [
          { value: 'short', label: 'Short' },
          { value: 'medium', label: 'Medium' },
          { value: 'long', label: 'Long' },
        ],
      },
      {
        key: 'personalizationToken',
        label: 'Personalization',
        type: 'toggle',
      },
      {
        key: 'type',
        label: 'Type',
        type: 'segmented',
        options: [
          { value: 'question', label: 'Question' },
          { value: 'statement', label: 'Statement' },
          { value: 'curiosity_gap', label: 'Curiosity Gap' },
          { value: 'list', label: 'List' },
          { value: 'announcement', label: 'Announcement' },
        ],
      },
      { key: 'urgency', label: 'Urgency', type: 'toggle' },
      { key: 'numberIncluded', label: 'Number', type: 'toggle' },
      { key: 'emoji', label: 'Emoji', type: 'toggle' },
      {
        key: 'casing',
        label: 'Casing',
        type: 'segmented',
        options: [
          { value: 'sentence', label: 'Sentence' },
          { value: 'title', label: 'Title Case' },
          { value: 'lowercase', label: 'lowercase' },
        ],
      },
    ],
  },
  {
    key: 'preheader',
    label: 'Preheader',
    fields: [
      { key: 'present', label: 'Present', type: 'toggle' },
      {
        key: 'length',
        label: 'Length',
        type: 'segmented',
        options: [
          { value: 'short', label: 'Short' },
          { value: 'medium', label: 'Medium' },
        ],
        hiddenWhen: { field: 'present', equals: false },
      },
      {
        key: 'relationship',
        label: 'vs Subject',
        type: 'segmented',
        options: [
          { value: 'complements', label: 'Complements' },
          { value: 'repeats', label: 'Repeats' },
        ],
        hiddenWhen: { field: 'present', equals: false },
      },
    ],
  },
  {
    key: 'sender',
    label: 'Sender',
    fields: [
      {
        key: 'nameType',
        label: 'Name',
        type: 'segmented',
        options: [
          { value: 'personal', label: 'Personal' },
          { value: 'company', label: 'Company' },
          { value: 'hybrid', label: 'Hybrid' },
        ],
      },
      { key: 'replyToSet', label: 'Reply-to set', type: 'toggle' },
    ],
  },
  {
    key: 'body',
    label: 'Body',
    fields: [
      {
        key: 'length',
        label: 'Length',
        type: 'segmented',
        options: [
          { value: 'short', label: '<75w' },
          { value: 'medium', label: 'Medium' },
          { value: 'long', label: '200w+' },
        ],
      },
      {
        key: 'format',
        label: 'Format',
        type: 'segmented',
        options: [
          { value: 'plain', label: 'Plain' },
          { value: 'html', label: 'HTML' },
        ],
      },
      {
        key: 'linkCount',
        label: 'Links',
        type: 'segmented',
        options: [
          { value: 'zero', label: '0' },
          { value: 'one', label: '1' },
          { value: 'two_plus', label: '2+' },
        ],
      },
      {
        key: 'readingLevel',
        label: 'Reading',
        type: 'segmented',
        options: [
          { value: 'simple', label: 'Simple' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'advanced', label: 'Advanced' },
        ],
      },
      { key: 'scannable', label: 'Scannable', type: 'toggle' },
    ],
  },
  {
    key: 'copyStrategy',
    label: 'Copy Strategy',
    fields: [
      {
        key: 'framework',
        label: 'Framework',
        type: 'segmented',
        options: [
          { value: 'AIDA', label: 'AIDA' },
          { value: 'PAS', label: 'PAS' },
          { value: 'BAB', label: 'BAB' },
          { value: 'FAB', label: 'FAB' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'persuasion',
        label: 'Persuasion',
        type: 'segmented',
        options: [
          { value: 'reciprocity', label: 'Reciprocity' },
          { value: 'social_proof', label: 'Social Proof' },
          { value: 'authority', label: 'Authority' },
          { value: 'scarcity', label: 'Scarcity' },
          { value: 'liking', label: 'Liking' },
          { value: 'commitment', label: 'Commitment' },
          { value: 'none', label: 'None' },
        ],
      },
      {
        key: 'emotion',
        label: 'Emotion',
        type: 'segmented',
        options: [
          { value: 'fear', label: 'Fear' },
          { value: 'aspiration', label: 'Aspiration' },
          { value: 'curiosity', label: 'Curiosity' },
          { value: 'humor', label: 'Humor' },
          { value: 'fomo', label: 'FOMO' },
          { value: 'status', label: 'Status' },
          { value: 'pain_relief', label: 'Pain-relief' },
        ],
      },
      {
        key: 'specificity',
        label: 'Specificity',
        type: 'segmented',
        options: [
          { value: 'hard_numbers', label: 'Hard #' },
          { value: 'vague', label: 'Vague' },
        ],
      },
      {
        key: 'personalizationDepth',
        label: 'Personalization',
        type: 'segmented',
        options: [
          { value: 'generic', label: 'Generic' },
          { value: 'merge_field', label: 'Merge-field' },
          { value: 'segment_tailored', label: 'Segment' },
          { value: 'one_to_one_researched', label: '1:1' },
        ],
      },
    ],
  },
  {
    key: 'cta',
    label: 'CTA',
    fields: [
      {
        key: 'count',
        label: 'Count',
        type: 'segmented',
        options: [
          { value: 'one', label: '1' },
          { value: 'two', label: '2' },
        ],
      },
      {
        key: 'type',
        label: 'Type',
        type: 'segmented',
        options: [
          { value: 'reply', label: 'Reply' },
          { value: 'book', label: 'Book' },
          { value: 'buy', label: 'Buy' },
          { value: 'read', label: 'Read' },
          { value: 'download', label: 'Download' },
        ],
      },
      {
        key: 'placement',
        label: 'Placement',
        type: 'segmented',
        options: [
          { value: 'inline', label: 'Inline' },
          { value: 'end', label: 'End' },
          { value: 'both', label: 'Both' },
        ],
      },
      {
        key: 'style',
        label: 'Style',
        type: 'segmented',
        options: [
          { value: 'button', label: 'Button' },
          { value: 'link', label: 'Link' },
          { value: 'plain_reply_ask', label: 'Plain Ask' },
        ],
      },
    ],
  },
  {
    key: 'offer',
    label: 'Offer',
    fields: [
      { key: 'hasOffer', label: 'Has offer', type: 'toggle' },
      {
        key: 'type',
        label: 'Type',
        type: 'segmented',
        options: [
          { value: 'percent_off', label: '% off' },
          { value: 'dollar_off', label: '$ off' },
          { value: 'free_trial', label: 'Free trial' },
          { value: 'bonus', label: 'Bonus' },
          { value: 'bundle', label: 'Bundle' },
          { value: 'guarantee', label: 'Guarantee' },
        ],
        hiddenWhen: { field: 'hasOffer', equals: false },
      },
      {
        key: 'magnitude',
        label: 'Magnitude',
        type: 'text',
        hiddenWhen: { field: 'hasOffer', equals: false },
      },
      {
        key: 'scarcity',
        label: 'Scarcity',
        type: 'segmented',
        options: [
          { value: 'none', label: 'None' },
          { value: 'time_limited', label: 'Time-limited' },
          { value: 'quantity_limited', label: 'Qty-limited' },
        ],
        hiddenWhen: { field: 'hasOffer', equals: false },
      },
    ],
  },
]

// --- Cold-outreach conservative defaults ---

export const DEFAULT_SUBJECT_LINE: SubjectLineValues = {
  length: 'short',
  personalizationToken: false,
  type: 'question',
  urgency: false,
  numberIncluded: false,
  emoji: false,
  casing: 'sentence',
}

export const DEFAULT_PREHEADER: PreheaderValues = {
  present: false,
  length: 'short',
  relationship: 'complements',
}

export const DEFAULT_SENDER: SenderValues = {
  nameType: 'personal',
  replyToSet: true,
}

export const DEFAULT_BODY: BodyValues = {
  length: 'short',
  format: 'plain',
  linkCount: 'zero',
  readingLevel: 'simple',
  scannable: false,
}

export const DEFAULT_COPY_STRATEGY: CopyStrategyValues = {
  framework: 'PAS',
  persuasion: 'none',
  emotion: 'curiosity',
  specificity: 'vague',
  personalizationDepth: 'merge_field',
}

export const DEFAULT_CTA: CtaValues = {
  count: 'one',
  type: 'reply',
  placement: 'end',
  style: 'plain_reply_ask',
}

export const DEFAULT_OFFER: OfferValues = {
  hasOffer: false,
  type: 'free_trial',
  magnitude: '',
  scarcity: 'none',
}

export const DEFAULT_LEVER_SUGGESTION: LeverSuggestion = {
  intent: {
    value: 'get_reply',
    reasoning: 'Default for cold first-touch.',
    locked: false,
  },
  subjectLine: {
    values: DEFAULT_SUBJECT_LINE,
    reasoning: 'Short, no-frills subject for cold outreach.',
    locked: false,
  },
  preheader: {
    values: DEFAULT_PREHEADER,
    reasoning: 'Skip preheader unless inbox preview needs support.',
    locked: false,
  },
  sender: {
    values: DEFAULT_SENDER,
    reasoning: 'Personal sender name builds trust with strangers.',
    locked: false,
  },
  body: {
    values: DEFAULT_BODY,
    reasoning: 'Short plain-text body respects cold recipient attention.',
    locked: false,
  },
  copyStrategy: {
    values: DEFAULT_COPY_STRATEGY,
    reasoning: 'PAS + curiosity suits cold outreach without being pushy.',
    locked: false,
  },
  cta: {
    values: DEFAULT_CTA,
    ctaCopy: 'Would you be open to a quick reply?',
    reasoning: 'Single soft reply ask at the end.',
    locked: false,
  },
  offer: {
    values: DEFAULT_OFFER,
    reasoning: 'No offer on first cold touch unless context implies one.',
    locked: false,
  },
}

export function emptyColdContext(): ColdContext {
  return {
    recipientName: '',
    recipientEmail: '',
    segmentAtSend: 'cold_prospect',
    sequenceNumber: 1,
  }
}

// --- Validation helpers ---

function pickEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T
  }
  return fallback
}

function pickBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

type RawCard = { values?: Record<string, unknown>; reasoning?: string; ctaCopy?: string }
type RawSuggestion = {
  intent?: { value?: string; reasoning?: string }
  subjectLine?: RawCard
  preheader?: RawCard
  sender?: RawCard
  body?: RawCard
  copyStrategy?: RawCard
  cta?: RawCard
  offer?: RawCard
}

export function normalizeLeverSuggestion(raw: RawSuggestion): LeverSuggestion {
  const d = DEFAULT_LEVER_SUGGESTION
  const sl = raw.subjectLine?.values ?? {}
  const ph = raw.preheader?.values ?? {}
  const sn = raw.sender?.values ?? {}
  const bd = raw.body?.values ?? {}
  const cs = raw.copyStrategy?.values ?? {}
  const ct = raw.cta?.values ?? {}
  const of = raw.offer?.values ?? {}

  return {
    intent: {
      value: pickEnum(
        raw.intent?.value,
        INTENT_OPTIONS.map((o) => o.value) as IntentValue[],
        d.intent.value,
      ),
      reasoning: pickString(raw.intent?.reasoning, d.intent.reasoning),
      locked: false,
    },
    subjectLine: {
      values: {
        length: pickEnum(sl.length, ['short', 'medium', 'long'], d.subjectLine.values.length),
        personalizationToken: pickBool(sl.personalizationToken, d.subjectLine.values.personalizationToken),
        type: pickEnum(sl.type, ['question', 'statement', 'curiosity_gap', 'list', 'announcement'], d.subjectLine.values.type),
        urgency: pickBool(sl.urgency, d.subjectLine.values.urgency),
        numberIncluded: pickBool(sl.numberIncluded, d.subjectLine.values.numberIncluded),
        emoji: pickBool(sl.emoji, d.subjectLine.values.emoji),
        casing: pickEnum(sl.casing, ['sentence', 'title', 'lowercase'], d.subjectLine.values.casing),
      },
      reasoning: pickString(raw.subjectLine?.reasoning, d.subjectLine.reasoning),
      locked: false,
    },
    preheader: {
      values: {
        present: pickBool(ph.present, d.preheader.values.present),
        length: pickEnum(ph.length, ['short', 'medium'], d.preheader.values.length),
        relationship: pickEnum(ph.relationship, ['complements', 'repeats'], d.preheader.values.relationship),
      },
      reasoning: pickString(raw.preheader?.reasoning, d.preheader.reasoning),
      locked: false,
    },
    sender: {
      values: {
        nameType: pickEnum(sn.nameType, ['personal', 'company', 'hybrid'], d.sender.values.nameType),
        replyToSet: pickBool(sn.replyToSet, d.sender.values.replyToSet),
      },
      reasoning: pickString(raw.sender?.reasoning, d.sender.reasoning),
      locked: false,
    },
    body: {
      values: {
        length: pickEnum(bd.length, ['short', 'medium', 'long'], d.body.values.length),
        format: pickEnum(bd.format, ['plain', 'html'], d.body.values.format),
        linkCount: pickEnum(bd.linkCount, ['zero', 'one', 'two_plus'], d.body.values.linkCount),
        readingLevel: pickEnum(bd.readingLevel, ['simple', 'moderate', 'advanced'], d.body.values.readingLevel),
        scannable: pickBool(bd.scannable, d.body.values.scannable),
      },
      reasoning: pickString(raw.body?.reasoning, d.body.reasoning),
      locked: false,
    },
    copyStrategy: {
      values: {
        framework: pickEnum(cs.framework, ['AIDA', 'PAS', 'BAB', 'FAB', 'none'], d.copyStrategy.values.framework),
        persuasion: pickEnum(cs.persuasion, ['reciprocity', 'social_proof', 'authority', 'scarcity', 'liking', 'commitment', 'none'], d.copyStrategy.values.persuasion),
        emotion: pickEnum(cs.emotion, ['fear', 'aspiration', 'curiosity', 'humor', 'fomo', 'status', 'pain_relief'], d.copyStrategy.values.emotion),
        specificity: pickEnum(cs.specificity, ['hard_numbers', 'vague'], d.copyStrategy.values.specificity),
        personalizationDepth: pickEnum(cs.personalizationDepth, ['generic', 'merge_field', 'segment_tailored', 'one_to_one_researched'], d.copyStrategy.values.personalizationDepth),
      },
      reasoning: pickString(raw.copyStrategy?.reasoning, d.copyStrategy.reasoning),
      locked: false,
    },
    cta: {
      values: {
        count: pickEnum(ct.count, ['one', 'two'], d.cta.values.count),
        type: pickEnum(ct.type, ['reply', 'book', 'buy', 'read', 'download'], d.cta.values.type),
        placement: pickEnum(ct.placement, ['inline', 'end', 'both'], d.cta.values.placement),
        style: pickEnum(ct.style, ['button', 'link', 'plain_reply_ask'], d.cta.values.style),
      },
      ctaCopy: pickString(raw.cta?.ctaCopy, d.cta.ctaCopy),
      reasoning: pickString(raw.cta?.reasoning, d.cta.reasoning),
      locked: false,
    },
    offer: {
      values: {
        hasOffer: pickBool(of.hasOffer, d.offer.values.hasOffer),
        type: pickEnum(of.type, ['percent_off', 'dollar_off', 'free_trial', 'bonus', 'bundle', 'guarantee'], d.offer.values.type),
        magnitude: pickString(of.magnitude, d.offer.values.magnitude),
        scarcity: pickEnum(of.scarcity, ['none', 'time_limited', 'quantity_limited'], d.offer.values.scarcity),
      },
      reasoning: pickString(raw.offer?.reasoning, d.offer.reasoning),
      locked: false,
    },
  }
}

// --- OpenAI JSON schema (generated) ---

function enumSchema(values: string[]) {
  return { type: 'string', enum: values }
}

function cardValuesSchema(props: Record<string, unknown>) {
  return {
    type: 'object',
    properties: props,
    required: Object.keys(props),
    additionalProperties: false,
  }
}

const intentValueSchema = enumSchema(INTENT_OPTIONS.map((o) => o.value))

const subjectValuesSchema = cardValuesSchema({
  length: enumSchema(['short', 'medium', 'long']),
  personalizationToken: { type: 'boolean' },
  type: enumSchema(['question', 'statement', 'curiosity_gap', 'list', 'announcement']),
  urgency: { type: 'boolean' },
  numberIncluded: { type: 'boolean' },
  emoji: { type: 'boolean' },
  casing: enumSchema(['sentence', 'title', 'lowercase']),
})

const preheaderValuesSchema = cardValuesSchema({
  present: { type: 'boolean' },
  length: enumSchema(['short', 'medium']),
  relationship: enumSchema(['complements', 'repeats']),
})

const senderValuesSchema = cardValuesSchema({
  nameType: enumSchema(['personal', 'company', 'hybrid']),
  replyToSet: { type: 'boolean' },
})

const bodyValuesSchema = cardValuesSchema({
  length: enumSchema(['short', 'medium', 'long']),
  format: enumSchema(['plain', 'html']),
  linkCount: enumSchema(['zero', 'one', 'two_plus']),
  readingLevel: enumSchema(['simple', 'moderate', 'advanced']),
  scannable: { type: 'boolean' },
})

const copyStrategyValuesSchema = cardValuesSchema({
  framework: enumSchema(['AIDA', 'PAS', 'BAB', 'FAB', 'none']),
  persuasion: enumSchema(['reciprocity', 'social_proof', 'authority', 'scarcity', 'liking', 'commitment', 'none']),
  emotion: enumSchema(['fear', 'aspiration', 'curiosity', 'humor', 'fomo', 'status', 'pain_relief']),
  specificity: enumSchema(['hard_numbers', 'vague']),
  personalizationDepth: enumSchema(['generic', 'merge_field', 'segment_tailored', 'one_to_one_researched']),
})

const ctaValuesSchema = cardValuesSchema({
  count: enumSchema(['one', 'two']),
  type: enumSchema(['reply', 'book', 'buy', 'read', 'download']),
  placement: enumSchema(['inline', 'end', 'both']),
  style: enumSchema(['button', 'link', 'plain_reply_ask']),
})

const offerValuesSchema = cardValuesSchema({
  hasOffer: { type: 'boolean' },
  type: enumSchema(['percent_off', 'dollar_off', 'free_trial', 'bonus', 'bundle', 'guarantee']),
  magnitude: { type: 'string' },
  scarcity: enumSchema(['none', 'time_limited', 'quantity_limited']),
})

function cardSchema(valuesSchema: Record<string, unknown>, extra?: Record<string, unknown>) {
  const properties: Record<string, unknown> = {
    values: valuesSchema,
    reasoning: { type: 'string' },
    ...extra,
  }
  const required = Object.keys(properties)
  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  }
}

export const SUGGEST_LEVERS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    intent: {
      type: 'object',
      properties: {
        value: intentValueSchema,
        reasoning: { type: 'string' },
      },
      required: ['value', 'reasoning'],
      additionalProperties: false,
    },
    subjectLine: cardSchema(subjectValuesSchema),
    preheader: cardSchema(preheaderValuesSchema),
    sender: cardSchema(senderValuesSchema),
    body: cardSchema(bodyValuesSchema),
    copyStrategy: cardSchema(copyStrategyValuesSchema),
    cta: cardSchema(ctaValuesSchema, { ctaCopy: { type: 'string' } }),
    offer: cardSchema(offerValuesSchema),
  },
  required: [
    'intent',
    'subjectLine',
    'preheader',
    'sender',
    'body',
    'copyStrategy',
    'cta',
    'offer',
  ],
  additionalProperties: false,
} as const

export const GENERATE_DRAFT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    preheader: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['subject', 'preheader', 'body'],
  additionalProperties: false,
} as const

export function cloneLeverSuggestion(
  source: LeverSuggestion = DEFAULT_LEVER_SUGGESTION,
): LeverSuggestion {
  return JSON.parse(JSON.stringify(source)) as LeverSuggestion
}

/** Keep user-locked cards/values; apply AI suggestions only to unlocked parts. */
export function mergeWithLocked(
  ai: LeverSuggestion,
  existing: LeverSuggestion | null | undefined,
): LeverSuggestion {
  if (!existing) return ai

  const out = cloneLeverSuggestion(ai)

  if (existing.intent.locked) {
    out.intent = { ...existing.intent, reasoning: ai.intent.reasoning }
  }

  if (existing.subjectLine.locked) {
    out.subjectLine = {
      ...existing.subjectLine,
      reasoning: ai.subjectLine.reasoning,
    }
  }
  if (existing.preheader.locked) {
    out.preheader = {
      ...existing.preheader,
      reasoning: ai.preheader.reasoning,
    }
  }
  if (existing.sender.locked) {
    out.sender = { ...existing.sender, reasoning: ai.sender.reasoning }
  }
  if (existing.body.locked) {
    out.body = { ...existing.body, reasoning: ai.body.reasoning }
  }
  if (existing.copyStrategy.locked) {
    out.copyStrategy = {
      ...existing.copyStrategy,
      reasoning: ai.copyStrategy.reasoning,
    }
  }
  if (existing.cta.locked) {
    out.cta = { ...existing.cta, reasoning: ai.cta.reasoning }
  }
  if (existing.offer.locked) {
    out.offer = { ...existing.offer, reasoning: ai.offer.reasoning }
  }

  return out
}

export function labelForOption(options: OptionDef[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value
}

export function labelForIntent(value: IntentValue): string {
  return labelForOption(INTENT_OPTIONS, value)
}
