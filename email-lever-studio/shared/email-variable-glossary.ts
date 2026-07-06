import type {
  CopyStrategyValues,
  CtaValues,
  FrameworkValue,
  IntentValue,
  OfferValues,
  PreheaderValues,
  SocialProofPlacement,
  SocialProofType,
  SocialProofValues,
  SubjectLineValues,
  BodyValues,
  SenderValues,
} from './schema.ts'
import type { VariableSectionKey } from './email-variables.ts'
import type { StyleKey } from './writing-styles.ts'

type BooleanValue = 'true' | 'false'

type GlossaryValue = {
  value: string
  meaning: string
  label?: string
}

export type EmailVariableGlossaryField = {
  key: string
  label: string
  whatItIs: string
  shownInStyleModal: boolean
  modalKey?: VariableSectionKey
  source?: {
    card: string
    field?: string
  }
  designNote?: string
  values?: readonly GlossaryValue[]
  freeForm?: {
    valueLabel: string
    meaning: string
  }
}

export type EmailVariableGlossarySection = {
  id: string
  label: string
  fields: readonly EmailVariableGlossaryField[]
}

const intentValues: Record<IntentValue, string> = {
  book_meeting: "The email's only job is to get a call or meeting on the calendar.",
  drive_purchase:
    'The email pushes directly toward a purchase or checkout, not a softer step first.',
  get_reply:
    'The goal is a reply in the inbox - starting a conversation, not a click or purchase.',
  click_to_page:
    'The goal is a click-through to a landing page, article, or site - the conversion happens after the email, not inside it.',
  collect_info:
    'The goal is getting the reader to submit information, like a form, survey, or quick answer, rather than buy or meet.',
  referral:
    'The goal is getting the reader to introduce, forward, or recommend to someone else, not act themselves.',
}

const frameworkValues: Record<FrameworkValue, string> = {
  PAS: 'Problem, Agitate, Solve - state a problem, twist the knife on why it hurts, then present the fix.',
  AIDA: 'Attention, Interest, Desire, Action - the classic funnel: hook, build interest, create wanting, ask.',
  BAB: 'Before, After, Bridge - paint life before the offer, life after it, then show the offer as the bridge between them.',
  FAB: 'Features, Advantages, Benefits - lead with what it is, then why that matters mechanically, then what it means for the reader.',
  QUEST:
    'Qualify, Understand, Educate, Stimulate, Transition - a softer, consultative structure that identifies the right reader before educating and pitching.',
  AIDCA:
    'Attention, Interest, Desire, Conviction, Action - AIDA with an added conviction step that handles proof and objections before the ask.',
  ACCA: 'Awareness, Comprehension, Conviction, Action - builds understanding before belief, then asks.',
  'Star-Story-Solution':
    'Open with a strong hook, tell a relevant story, and land on the solution or offer.',
  'Star-Chain-Hook':
    'A striking opening, a chain of connected reasons or logic, and a final hook that drives action.',
  PASTOR:
    'Problem, Amplify, Story, Transformation, Offer, Response - a longer-form structure that adds a personal story and transformation arc to PAS.',
  Because:
    'Leans on giving an explicit reason for the ask - reasons increase compliance even when the reason is simple.',
  'Slippery Slide':
    'Each line is written to pull the reader into the next line, so momentum carries them to the CTA without a hard sell.',
  'Value Prop (Pain/Gain/Job)':
    "Organized around the reader's pain, the gain they want, and the job they are trying to get done.",
  '4 Us': 'Copy is checked against being Useful, Urgent, Unique, and Ultra-specific.',
  '4 Cs': 'Copy is checked against being Clear, Concise, Compelling, and Credible.',
  'Hook-Story-Offer':
    'Open with a hook, deliver a short story that builds context or trust, and close with the offer.',
  PPPP: "Picture, Promise, Prove, Push - paint a picture, promise an outcome, prove it's real, push for action.",
  SLAP: 'Stop, Look, Act, Purchase - a punchy, fast-attention structure aimed at quick decisions.',
  none: "No named framework was applied; the copy wasn't built on a specific structural template.",
}

const emotionValues: Record<CopyStrategyValues['emotion'], string> = {
  fear: 'Motivates by making the cost of inaction, or a risk, feel real.',
  aspiration:
    'Motivates by painting a desirable future identity or outcome the reader wants to become.',
  curiosity:
    'Motivates by opening a gap between what the reader knows and wants to know.',
  humor: 'Motivates through wit or lightness to build liking and lower resistance.',
  fomo: 'Fear of missing out - motivates through the fear of being left behind others.',
  status:
    "Motivates by appealing to how the reader will be seen or how they'll rank relative to peers.",
  pain_relief:
    'Motivates by directly addressing an existing discomfort and offering relief from it.',
}

const persuasionValues: Record<CopyStrategyValues['persuasion'], string> = {
  reciprocity:
    'The email gives something of value first, creating a felt obligation to respond.',
  authority: 'The ask is backed by credentials, expertise, or a trusted source.',
  scarcity: 'The ask is framed around limited availability - time, quantity, or access.',
  liking: 'The ask leans on rapport, similarity, or being likeable rather than pressure.',
  commitment:
    "The ask leans on the reader's prior stated interest or small prior actions to draw them into a bigger one.",
  none: 'No specific persuasion principle was deliberately applied.',
}

const specificityValues: Record<CopyStrategyValues['specificity'], string> = {
  hard_numbers:
    'Claims use exact figures, like percentages, dollar amounts, counts, or dates, rather than general language.',
  vague:
    'Claims stay general, like "a lot of customers" or "significant results," without concrete figures.',
}

const personalizationValues: Record<CopyStrategyValues['personalizationDepth'], string> = {
  generic: 'Same copy for everyone - no tailoring to the recipient at all.',
  merge_field:
    'Copy inserts basic known fields, like first name or company name, into an otherwise generic template.',
  segment_tailored:
    'Copy is written differently per audience segment, like industry, role, or company size, not per individual.',
  one_to_one_researched:
    'Copy is written or adjusted based on specific research about that individual recipient - the deepest level of tailoring.',
}

const authorValues: Record<StyleKey, { label: string; meaning: string }> = {
  kennedy: {
    label: 'Dan Kennedy',
    meaning:
      'Blunt, no-nonsense, sales-first direct response; short on pleasantries, heavy on the ask.',
  },
  ogilvy: {
    label: 'David Ogilvy',
    meaning: "Polished, research-driven, factual, respects the reader's intelligence.",
  },
  kern: {
    label: 'Frank Kern',
    meaning:
      'Casual, conversational, story-led, feels like an email from a friend rather than a marketer.',
  },
  chaperon: {
    label: 'Andre Chaperon',
    meaning:
      'Serialized, narrative-driven soap opera sequence storytelling that builds over multiple emails.',
  },
  halbert: {
    label: 'Gary Halbert',
    meaning: 'Punchy, personality-heavy, old-school hard-sell direct mail voice.',
  },
  schwartz: {
    label: 'Eugene Schwartz',
    meaning:
      'Built around market awareness - meets the reader exactly where their existing beliefs are.',
  },
  albuquerque: {
    label: 'Evaldo Albuquerque',
    meaning:
      'Emotionally-driven, Copy Accelerator-style storytelling used heavily in supplement and health marketing.',
  },
  makepeace: {
    label: 'Clayton Makepeace',
    meaning:
      'Aggressive benefit-stacking and urgency, common in long-form direct-response sales letters.',
  },
  brunson: {
    label: 'Russell Brunson',
    meaning:
      'Funnel-and-story-driven, hook-story-offer style built around a bigger narrative arc.',
  },
  bencivenga: {
    label: 'Gary Bencivenga',
    meaning: 'Meticulous, proof-heavy, credibility-first persuasion.',
  },
  carlton: {
    label: 'John Carlton',
    meaning: 'Gritty, punchy, entertaining street-smart copy with strong hooks.',
  },
  settle: {
    label: 'Ben Settle',
    meaning:
      'Short, opinionated, personality-driven daily email style with minimal warm-up.',
  },
}

const subjectTypeValues: Record<SubjectLineValues['type'], string> = {
  question: 'Subject is phrased as a question to the reader.',
  statement: 'Subject makes a direct declarative statement.',
  curiosity_gap:
    'Subject deliberately withholds information to create an urge to open and find out more.',
  list: 'Subject signals a list or enumerated content, like "3 ways to...".',
  announcement: 'Subject reads as news or an announcement of something new or changed.',
}

const lengthValues: Record<SubjectLineValues['length'] | BodyValues['length'], string> = {
  short: 'Brief and optimized for quick scanning.',
  medium: 'Moderate length, balancing context with brevity.',
  long: 'Longer and more developed.',
}

const subjectCasingValues: Record<SubjectLineValues['casing'], string> = {
  sentence: 'Only the first word and proper nouns are capitalized, like a normal sentence.',
  title: 'Each Major Word Is Capitalized.',
  lowercase: 'Entirely lowercase, for a casual or personal feel.',
}

const preheaderLengthValues: Record<PreheaderValues['length'], string> = {
  short: 'A brief preheader, just enough to reinforce or nudge.',
  medium: 'A fuller preheader that adds real additional context.',
}

const preheaderRelationshipValues: Record<PreheaderValues['relationship'], string> = {
  complements:
    'The preheader adds new information beyond the subject line rather than restating it.',
  repeats:
    'The preheader reinforces or echoes the subject line rather than adding anything new.',
}

const bodyLengthValues: Record<BodyValues['length'], string> = {
  short: 'A brief, to-the-point email - a few lines.',
  medium: 'A moderate-length email with some development of the argument.',
  long: 'A long-form email that fully develops a story or argument before the ask.',
}

const bodyLinkValues: Record<BodyValues['linkCount'], string> = {
  zero: 'No links in the body - the only path forward is replying or the CTA.',
  one: "Exactly one link, keeping the reader's choice singular and focused.",
  two_plus: 'Two or more links, giving the reader multiple paths or references.',
}

const bodyScannableValues: Record<BooleanValue, string> = {
  true: 'Body uses short paragraphs, line breaks, or bullets designed to be skimmed quickly.',
  false: 'Body reads as continuous prose, meant to be read start to finish.',
}

const socialProofTypeValues: Record<SocialProofType, string> = {
  none: 'No social proof used in this email.',
  volume: 'Proof by numbers - for example, "10,000 customers" or "used by X companies."',
  name_drop: 'Proof by naming a recognizable client, brand, or person.',
  peer: 'Proof by referencing people similar to the reader, such as the same role, industry, or size.',
  result: 'Proof by citing a concrete outcome or result achieved.',
  quote: 'Proof via a direct testimonial quote.',
  recency: 'Proof by emphasizing something happened recently, like "just closed" or "this week."',
  consensus: 'Proof by implying broad agreement or adoption, like "most teams now...".',
}

const socialProofPlacementValues: Record<SocialProofPlacement, string> = {
  opener: 'Social proof appears right at the start, before the main pitch.',
  body: 'Social proof is woven into the main body of the argument.',
  pre_cta: 'Social proof appears immediately before the call to action, as a final nudge.',
  ps: 'Social proof appears in a postscript line after the sign-off.',
}

const proofSpecificityValues: Record<SocialProofValues['specificity'], string> = {
  vague: 'Proof is stated in general terms without hard figures.',
  specific: 'Proof includes a concrete, checkable detail, like a number, name, or date.',
}

const ctaTypeValues: Record<CtaValues['type'], { label: string; meaning: string }> = {
  reply: {
    label: 'Soft ask',
    meaning: 'Asks the reader to simply reply, the lowest-friction ask.',
  },
  book: { label: 'Book', meaning: 'Asks the reader to book a meeting or call.' },
  buy: { label: 'Buy', meaning: 'Asks the reader to make a purchase.' },
  read: {
    label: 'Read',
    meaning: 'Asks the reader to read or view something, like an article, page, or doc.',
  },
  download: {
    label: 'Download',
    meaning: 'Asks the reader to download a file or resource.',
  },
}

const ctaStyleValues: Record<CtaValues['style'], string> = {
  button: 'A clickable button-styled CTA.',
  link: 'A plain text hyperlink CTA.',
  plain_reply_ask:
    'No link or button at all - the ask is just a line of text asking for a reply.',
}

const ctaPlacementValues: Record<CtaValues['placement'], string> = {
  inline: 'The CTA appears within the body text itself.',
  end: 'The CTA appears only at the end of the email.',
  both: 'The CTA appears both inline and again at the end.',
}

const offerTypeValues: Record<OfferValues['type'], string> = {
  percent_off: 'A percentage discount.',
  dollar_off: 'A flat dollar-amount discount.',
  free_trial: 'Free access for a limited period before paying.',
  bonus: 'An extra item or service included at no additional cost.',
  bundle: 'Multiple items or services packaged together, like a 2-for-1.',
  guarantee: 'A risk-reversal promise, like a money-back guarantee.',
}

const offerPresentValues: Record<BooleanValue, string> = {
  true: 'An incentive is attached to the ask.',
  false: 'No incentive is attached to the ask.',
}

const senderNameTypeValues: Record<SenderValues['nameType'], string> = {
  personal: 'The email appears to come from a person.',
  company: 'The email appears to come from the company.',
  hybrid: 'The email appears to come from both a person and the company.',
}

const replyToSetValues: Record<BooleanValue, string> = {
  true: 'A real reply-to address was configured.',
  false: 'No real reply-to address was configured, or replies are discouraged.',
}

const bodyFormatValues: Record<BodyValues['format'], string> = {
  plain: 'Plain text email body.',
  html: 'HTML-styled email body.',
}

const bodyReadingLevelValues: Record<BodyValues['readingLevel'], string> = {
  simple: 'Simple reading complexity.',
  moderate: 'Moderate reading complexity.',
  advanced: 'Advanced reading complexity.',
}

const ctaCountValues: Record<CtaValues['count'], string> = {
  one: 'One CTA appears in total.',
  two: 'Two CTAs appear in total.',
}

const offerScarcityValues: Record<OfferValues['scarcity'], string> = {
  none: 'The offer is not time- or quantity-limited.',
  time_limited: 'The offer is limited by time.',
  quantity_limited: 'The offer is limited by quantity or access.',
}

function valuesFromRecord<T extends Record<string, string>>(record: T): GlossaryValue[] {
  return Object.entries(record).map(([value, meaning]) => ({ value, meaning }))
}

function valuesFromLabeledRecord<T extends Record<string, { label: string; meaning: string }>>(
  record: T,
): GlossaryValue[] {
  return Object.entries(record).map(([value, entry]) => ({
    value,
    label: entry.label,
    meaning: entry.meaning,
  }))
}

export const EMAIL_VARIABLE_GLOSSARY = [
  {
    id: 'copyStrategy',
    label: 'Copy Strategy',
    fields: [
      {
        key: 'intent',
        label: 'Intent',
        modalKey: 'intent',
        shownInStyleModal: true,
        source: { card: 'intent', field: 'value' },
        whatItIs:
          'The one strategic outcome this email is optimized to produce. Everything else - framework, emotion, and CTA - is chosen to serve this single goal.',
        values: valuesFromRecord(intentValues),
      },
      {
        key: 'framework',
        label: 'Framework',
        modalKey: 'framework',
        shownInStyleModal: true,
        source: { card: 'copyStrategy', field: 'framework' },
        whatItIs:
          'The structural skeleton the copy is built on - the order in which persuasion beats appear, such as problem, story, proof, and ask.',
        values: valuesFromRecord(frameworkValues),
      },
      {
        key: 'emotion',
        label: 'Emotion',
        modalKey: 'emotion',
        shownInStyleModal: true,
        source: { card: 'copyStrategy', field: 'emotion' },
        whatItIs:
          'The single emotional lever the copy leans on to motivate the reader, independent of the logical argument.',
        values: valuesFromRecord(emotionValues),
      },
      {
        key: 'persuasion',
        label: 'Persuasion',
        modalKey: 'persuasion',
        shownInStyleModal: true,
        source: { card: 'copyStrategy', field: 'persuasion' },
        whatItIs:
          "The specific psychological principle of influence, per Cialdini's classic categories, used to increase the odds of compliance.",
        values: valuesFromRecord(persuasionValues),
      },
      {
        key: 'specificity',
        label: 'Specificity',
        modalKey: 'specificity',
        shownInStyleModal: true,
        source: { card: 'copyStrategy', field: 'specificity' },
        whatItIs: 'How concrete versus abstract the claims and proof points in the copy are.',
        values: valuesFromRecord(specificityValues),
      },
      {
        key: 'personalization',
        label: 'Personalization',
        modalKey: 'personalization',
        shownInStyleModal: true,
        source: { card: 'copyStrategy', field: 'personalizationDepth' },
        whatItIs:
          'How deeply the copy is tailored to the specific reader, as opposed to being one generic message sent to everyone.',
        values: valuesFromRecord(personalizationValues),
      },
    ],
  },
  {
    id: 'writingStyle',
    label: 'Writing Style',
    fields: [
      {
        key: 'writingStyle',
        label: 'Author',
        modalKey: 'writingStyle',
        shownInStyleModal: true,
        source: { card: 'writingStyle', field: 'styleKey' },
        whatItIs:
          "Which real direct-response copywriter's voice, structure, and tone the email is modeled after. This drives tone and rhythm more than any single lever.",
        designNote:
          'If writingStyle is null, no author was assigned and the whole section should stay hidden.',
        values: valuesFromLabeledRecord(authorValues),
      },
    ],
  },
  {
    id: 'subjectLine',
    label: 'Subject Line',
    fields: [
      {
        key: 'subjectType',
        label: 'Type',
        modalKey: 'subjectType',
        shownInStyleModal: true,
        source: { card: 'subjectLine', field: 'type' },
        whatItIs:
          "The rhetorical form of the subject line - how it's phrased to earn the open.",
        values: valuesFromRecord(subjectTypeValues),
      },
      {
        key: 'subjectLength',
        label: 'Length',
        modalKey: 'subjectLength',
        shownInStyleModal: true,
        source: { card: 'subjectLine', field: 'length' },
        whatItIs: 'The overall length bucket of the subject line.',
        values: valuesFromRecord({
          short: 'Brief subject, optimized for mobile inbox previews and quick scanning.',
          medium: lengthValues.medium,
          long: 'Longer, more descriptive subject line.',
        }),
      },
      {
        key: 'subjectCasing',
        label: 'Casing',
        modalKey: 'subjectCasing',
        shownInStyleModal: true,
        source: { card: 'subjectLine', field: 'casing' },
        whatItIs: 'The capitalization style applied to the subject line.',
        values: valuesFromRecord(subjectCasingValues),
      },
    ],
  },
  {
    id: 'preheader',
    label: 'Preheader',
    fields: [
      {
        key: 'preheaderPresent',
        label: 'Present',
        modalKey: 'preheader',
        shownInStyleModal: true,
        source: { card: 'preheader', field: 'present' },
        whatItIs:
          "The preview text shown next to the subject line in most inboxes - the reader's second signal after the subject, before they open the email.",
        values: valuesFromRecord({
          true: 'A deliberate preheader was written.',
          false:
            "No deliberate preheader was written, so the inbox may default to the email's first line.",
        }),
      },
      {
        key: 'preheaderLength',
        label: 'Length',
        modalKey: 'preheader',
        shownInStyleModal: true,
        source: { card: 'preheader', field: 'length' },
        whatItIs:
          'The length bucket for the preview text shown next to the subject line in most inboxes.',
        values: valuesFromRecord(preheaderLengthValues),
      },
      {
        key: 'preheaderRelationship',
        label: 'Relationship',
        modalKey: 'preheader',
        shownInStyleModal: true,
        source: { card: 'preheader', field: 'relationship' },
        whatItIs:
          'How the preheader relates to the subject line: adding new context or reinforcing the same idea.',
        values: valuesFromRecord(preheaderRelationshipValues),
      },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    fields: [
      {
        key: 'bodyLength',
        label: 'Length',
        modalKey: 'bodyLength',
        shownInStyleModal: true,
        source: { card: 'body', field: 'length' },
        whatItIs: "The overall length of the email's body copy.",
        values: valuesFromRecord(bodyLengthValues),
      },
      {
        key: 'bodyLinks',
        label: 'Links',
        modalKey: 'bodyLinks',
        shownInStyleModal: true,
        source: { card: 'body', field: 'linkCount' },
        whatItIs:
          'How many hyperlinks appear in the body, separate from the CTA button itself.',
        values: valuesFromRecord(bodyLinkValues),
      },
      {
        key: 'bodyScannable',
        label: 'Scannable',
        modalKey: 'bodyScannable',
        shownInStyleModal: true,
        source: { card: 'body', field: 'scannable' },
        whatItIs:
          'Whether the body is formatted for skimming or written as continuous prose.',
        values: valuesFromRecord(bodyScannableValues),
      },
    ],
  },
  {
    id: 'socialProof',
    label: 'Social Proof',
    fields: [
      {
        key: 'socialProofType',
        label: 'Type',
        modalKey: 'socialProofType',
        shownInStyleModal: true,
        source: { card: 'socialProof', field: 'type' },
        whatItIs:
          "The kind of credibility signal used to reduce the reader's risk perception.",
        values: valuesFromRecord(socialProofTypeValues),
      },
      {
        key: 'socialProofPlacement',
        label: 'Placement',
        modalKey: 'socialProofPlacement',
        shownInStyleModal: true,
        source: { card: 'socialProof', field: 'placement' },
        whatItIs: 'Where in the email the social proof appears.',
        values: valuesFromRecord(socialProofPlacementValues),
      },
      {
        key: 'socialProofSpecificity',
        label: 'Specificity',
        modalKey: 'socialProofSpecificity',
        shownInStyleModal: true,
        source: { card: 'socialProof', field: 'specificity' },
        whatItIs:
          'How concrete the proof point itself is, scoped only to the proof.',
        values: valuesFromRecord(proofSpecificityValues),
      },
    ],
  },
  {
    id: 'cta',
    label: 'CTA',
    fields: [
      {
        key: 'ctaType',
        label: 'Type',
        modalKey: 'ctaType',
        shownInStyleModal: true,
        source: { card: 'cta', field: 'type' },
        whatItIs:
          'The category of action the email is asking the reader to take right now.',
        values: valuesFromLabeledRecord(ctaTypeValues),
      },
      {
        key: 'ctaStyle',
        label: 'Style',
        modalKey: 'ctaStyle',
        shownInStyleModal: true,
        source: { card: 'cta', field: 'style' },
        whatItIs: 'The visual or format treatment of the CTA itself.',
        values: valuesFromRecord(ctaStyleValues),
      },
      {
        key: 'ctaPlacement',
        label: 'Placement',
        modalKey: 'ctaPlacement',
        shownInStyleModal: true,
        source: { card: 'cta', field: 'placement' },
        whatItIs: 'Where the CTA sits within the email.',
        values: valuesFromRecord(ctaPlacementValues),
      },
      {
        key: 'ctaCopy',
        label: 'Copy',
        modalKey: 'ctaCopy',
        shownInStyleModal: true,
        source: { card: 'cta', field: 'ctaCopy' },
        whatItIs: 'The literal text used for the ask.',
        freeForm: {
          valueLabel: 'Free text',
          meaning:
            'Free-form, not a fixed set of values, such as "Should I send the benchmark sheet?"',
        },
      },
    ],
  },
  {
    id: 'offer',
    label: 'Offer',
    fields: [
      {
        key: 'hasOffer',
        label: 'Present',
        modalKey: 'offer',
        shownInStyleModal: true,
        source: { card: 'offer', field: 'hasOffer' },
        whatItIs:
          'Whether the email includes a concrete incentive to act, and what kind.',
        values: valuesFromRecord(offerPresentValues),
      },
      {
        key: 'offerType',
        label: 'Type',
        modalKey: 'offer',
        shownInStyleModal: true,
        source: { card: 'offer', field: 'type' },
        whatItIs: 'The kind of incentive attached to the ask.',
        values: valuesFromRecord(offerTypeValues),
      },
      {
        key: 'offerMagnitude',
        label: 'Magnitude',
        modalKey: 'offer',
        shownInStyleModal: true,
        source: { card: 'offer', field: 'magnitude' },
        whatItIs: 'The specific size of the offer.',
        freeForm: {
          valueLabel: 'Free text',
          meaning: 'The specific size of the offer, such as 15%, $20, 14 days, or 2-for-1.',
        },
      },
    ],
  },
  {
    id: 'trackedButHidden',
    label: 'Tracked but not currently shown in the modal',
    fields: [
      {
        key: 'senderNameType',
        label: 'Sender name type',
        shownInStyleModal: false,
        source: { card: 'sender', field: 'nameType' },
        whatItIs: 'Whether the email appears to come from a person, the company, or both.',
        values: valuesFromRecord(senderNameTypeValues),
      },
      {
        key: 'replyToSet',
        label: 'Reply-to set',
        shownInStyleModal: false,
        source: { card: 'sender', field: 'replyToSet' },
        whatItIs: 'Whether a real reply-to address, vs. no-reply, was configured.',
        values: valuesFromRecord(replyToSetValues),
      },
      {
        key: 'subjectPersonalizationToken',
        label: 'Subject personalization token',
        shownInStyleModal: false,
        source: { card: 'subjectLine', field: 'personalizationToken' },
        whatItIs: 'Whether the subject line itself includes a merge field.',
        values: valuesFromRecord({
          true: 'The subject line includes a merge field.',
          false: 'The subject line does not include a merge field.',
        }),
      },
      {
        key: 'subjectUrgency',
        label: 'Subject urgency',
        shownInStyleModal: false,
        source: { card: 'subjectLine', field: 'urgency' },
        whatItIs: 'Whether the subject line conveys time pressure.',
        values: valuesFromRecord({
          true: 'The subject line conveys time pressure.',
          false: 'The subject line does not convey time pressure.',
        }),
      },
      {
        key: 'subjectNumberIncluded',
        label: 'Subject number included',
        shownInStyleModal: false,
        source: { card: 'subjectLine', field: 'numberIncluded' },
        whatItIs: 'Whether the subject line contains a number.',
        values: valuesFromRecord({
          true: 'The subject line contains a number.',
          false: 'The subject line does not contain a number.',
        }),
      },
      {
        key: 'subjectEmoji',
        label: 'Subject emoji',
        shownInStyleModal: false,
        source: { card: 'subjectLine', field: 'emoji' },
        whatItIs: 'Whether the subject line uses an emoji.',
        values: valuesFromRecord({
          true: 'The subject line uses an emoji.',
          false: 'The subject line does not use an emoji.',
        }),
      },
      {
        key: 'bodyFormat',
        label: 'Body format',
        shownInStyleModal: false,
        source: { card: 'body', field: 'format' },
        whatItIs: 'Whether the body is plain text or HTML-styled.',
        values: valuesFromRecord(bodyFormatValues),
      },
      {
        key: 'bodyReadingLevel',
        label: 'Body reading level',
        shownInStyleModal: false,
        source: { card: 'body', field: 'readingLevel' },
        whatItIs: 'The reading complexity the copy targets.',
        values: valuesFromRecord(bodyReadingLevelValues),
      },
      {
        key: 'ctaCount',
        label: 'CTA count',
        shownInStyleModal: false,
        source: { card: 'cta', field: 'count' },
        whatItIs: 'How many CTAs appear in total.',
        values: valuesFromRecord(ctaCountValues),
      },
      {
        key: 'offerScarcity',
        label: 'Offer scarcity',
        shownInStyleModal: false,
        source: { card: 'offer', field: 'scarcity' },
        whatItIs: 'Whether the offer itself is time- or quantity-limited.',
        values: valuesFromRecord(offerScarcityValues),
      },
    ],
  },
] as const satisfies readonly EmailVariableGlossarySection[]

const EMAIL_VARIABLE_GLOSSARY_FIELD_MAP = new Map(
  EMAIL_VARIABLE_GLOSSARY.flatMap((section) =>
    section.fields.map((field) => [field.key, field] as const),
  ),
)

export function getEmailVariableGlossaryField(
  key: string,
): EmailVariableGlossaryField | undefined {
  return EMAIL_VARIABLE_GLOSSARY_FIELD_MAP.get(key)
}

export function getEmailVariableGlossaryValue(
  key: string,
  value: string | boolean | null | undefined,
): GlossaryValue | undefined {
  if (value === null || value === undefined) return undefined

  const field = getEmailVariableGlossaryField(key)
  if (!field?.values) return undefined

  return field.values.find((entry) => entry.value === String(value))
}
