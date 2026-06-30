import type { ColdContext, LeverSuggestion } from '../shared/schema.ts'
import {
  CARD_DEFINITIONS,
  CUSTOMER_SEGMENT_OPTIONS,
  labelForIntent,
  labelForOption,
  labelForSegment,
  type CustomerSegment,
} from '../shared/schema.ts'

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
    `Segment: ${context.segmentAtSend} (${labelForSegment(context.segmentAtSend)}) · Email 1 · New Thread · Campaign: Cold Outreach`,
  ]

  if (context.notes?.trim()) {
    lines.push(`Notes: ${context.notes}`)
  }

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
    `CTA — ${formatCardValues('cta', levers.cta.values)}; CTA copy text: "${levers.cta.ctaCopy}"`,
    `Offer — ${formatCardValues('offer', levers.offer.values)}`,
  ]

  return sections.join('\n')
}

export function validateColdContext(context: ColdContext): string | null {
  if (!context.recipientName?.trim()) return 'Recipient name is required.'
  if (!context.recipientEmail?.trim()) return 'Recipient email is required.'
  if (
    !CUSTOMER_SEGMENT_OPTIONS.includes(
      context.segmentAtSend as CustomerSegment,
    )
  ) {
    return 'Invalid customer segment.'
  }
  return null
}
