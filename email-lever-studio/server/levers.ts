import type { ColdContext, LeverSuggestion } from '../shared/schema.ts'
import {
  CARD_DEFINITIONS,
  CUSTOMER_SEGMENT_OPTIONS,
  labelForIntent,
  labelForOption,
  labelForSegment,
  type CustomerSegment,
} from '../shared/schema.ts'

function assetOrNone(value: string | undefined): string {
  return value?.trim() ? value.trim() : 'none provided'
}

export function formatSocialProofAssetsForPrompt(context: ColdContext): string {
  const assets = context.socialProofAssets ?? {}
  return [
    'Social proof assets (sender provided):',
    `- Recognizable customer: ${assetOrNone(assets.recognizableCustomer)}`,
    `- Specific result: ${assetOrNone(assets.specificResult)}`,
    `- Customer quote: ${assetOrNone(assets.customerQuote)}`,
    `- Customer count: ${assetOrNone(assets.customerCount)}`,
    `- Recent win: ${assetOrNone(assets.recentWin)}`,
  ].join('\n')
}

export function formatContextForPrompt(context: ColdContext): string {
  const profileParts: string[] = []
  if (context.companyName?.trim()) profileParts.push(`company=${context.companyName}`)
  if (context.industry?.trim()) profileParts.push(`industry=${context.industry}`)
  if (context.role?.trim()) profileParts.push(`role=${context.role}`)
  if (context.seniority?.trim()) profileParts.push(`seniority=${context.seniority}`)
  if (context.companySize?.trim()) profileParts.push(`company_size=${context.companySize}`)
  if (context.country?.trim()) profileParts.push(`country=${context.country}`)
  if (context.language?.trim()) profileParts.push(`language=${context.language}`)

  const lines = [
    `Recipient: ${context.recipientName} <${context.recipientEmail}>`,
    profileParts.length > 0
      ? `Profile: ${profileParts.join(', ')}`
      : 'Profile: (sparse — little known beyond name/email)',
    `Segment: ${context.segmentAtSend} (${labelForSegment(context.segmentAtSend as CustomerSegment)}) · Email 1 · New Thread · Campaign: Cold Outreach`,
  ]

  if (context.notes?.trim()) {
    lines.push(`Notes: ${context.notes}`)
  }

  lines.push('', formatSocialProofAssetsForPrompt(context))

  return lines.join('\n')
}

function formatCardValues(
  cardKey: string,
  values: Record<string, unknown>,
): string {
  const card = CARD_DEFINITIONS.find((c) => c.key === cardKey)
  if (!card) return JSON.stringify(values)

  return card.fields
    .map((field) => {
      const val = values[field.key]
      if (field.type === 'segmented') {
        const label =
          typeof val === 'string'
            ? labelForOption(field.options, val)
            : String(val)
        return `${field.label}: ${label}`
      }
      if (field.type === 'toggle') {
        return `${field.label}: ${val ? 'on' : 'off'}`
      }
      return `${field.label}: ${val ?? ''}`
    })
    .join('; ')
}

export function formatLeversForPrompt(levers: LeverSuggestion): string {
  const sections = [
    `Intent: ${labelForIntent(levers.intent.value)}`,
    `Subject Line — ${formatCardValues('subjectLine', levers.subjectLine.values)}`,
    `Preheader — ${formatCardValues('preheader', levers.preheader.values)}`,
    `Sender — ${formatCardValues('sender', levers.sender.values)}`,
    `Body — ${formatCardValues('body', levers.body.values)}`,
    `Copy Strategy — ${formatCardValues('copyStrategy', levers.copyStrategy.values)}`,
    `Social Proof — ${formatCardValues('socialProof', levers.socialProof.values)}`,
    `CTA — ${formatCardValues('cta', levers.cta.values)}; CTA copy text: "${levers.cta.ctaCopy}"`,
    `Offer — ${formatCardValues('offer', levers.offer.values)}`,
  ]

  return sections.join('\n')
}

export function formatSocialProofInstructions(
  context: ColdContext,
  levers: LeverSuggestion,
): string {
  const assets = context.socialProofAssets ?? {}
  const sp = levers.socialProof.values

  return [
    'Social proof:',
    `- Type: ${sp.type}`,
    `- Placement: ${sp.placement}`,
    `- Specificity: ${sp.specificity}`,
    '',
    'Available proof assets (from sender):',
    `- Recognizable customer: ${assetOrNone(assets.recognizableCustomer)}`,
    `- Specific result: ${assetOrNone(assets.specificResult)}`,
    `- Customer quote: ${assetOrNone(assets.customerQuote)}`,
    `- Customer count: ${assetOrNone(assets.customerCount)}`,
    `- Recent win: ${assetOrNone(assets.recentWin)}`,
    '',
    'Rules:',
    '- If type is "none": do not include any social proof in the email. Skip this section entirely.',
    '- If specificity is "specific" AND the relevant asset field is "none provided": do not fabricate proof. Omit social proof from the email entirely and do not mention it.',
    '- If specificity is "vague": you may write general proof language ("teams like yours", "many of our customers") without needing a specific asset.',
    `- Place the proof at the "${sp.placement}" position in the email structure.`,
    '- Match the proof type to the asset: use recognizableCustomer for name_drop, specificResult for result, customerQuote for quote, customerCount for volume, recentWin for recency.',
    '- For "peer" and "consensus" types, use the recognizableCustomer asset if available, otherwise write general peer language.',
  ].join('\n')
}

export function validateColdContext(context: ColdContext): string | null {
  if (!context.recipientName?.trim()) return 'Recipient name is required.'
  if (!context.recipientEmail?.trim()) return 'Recipient email is required.'
  if (
    !context.segmentAtSend ||
    !CUSTOMER_SEGMENT_OPTIONS.includes(context.segmentAtSend)
  ) {
    return 'Please select a relationship.'
  }
  return null
}
