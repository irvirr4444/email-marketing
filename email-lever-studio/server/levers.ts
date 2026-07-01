import type { ColdContext } from '../shared/schema.ts'
import {
  CUSTOMER_SEGMENT_OPTIONS,
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
