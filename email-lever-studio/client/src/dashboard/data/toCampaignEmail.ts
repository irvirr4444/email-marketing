import { fromGeneratedEmailRow } from '../../../../shared/email-variables.ts'
import type { CampaignEmail, EmailMetrics } from '../types'
import type { GeneratedEmailWithStyle } from './generatedEmails'

const EMPTY_METRICS: EmailMetrics = {
  sent: 0,
  opens: 0,
  openRate: 0,
  clicks: 0,
  clickRate: 0,
  replies: 0,
  replyRate: 0,
  conversions: 0,
}

/**
 * Map a generated_email row (a draft/template) into the dashboard `CampaignEmail`
 * shape. Generated emails carry the copy + lever variables but no send metrics
 * or recipients yet, so those are represented as empty/pending.
 */
export function toCampaignEmail(row: GeneratedEmailWithStyle): CampaignEmail {
  return {
    id: row.id,
    campaignId: row.campaign_id ?? '',
    subject: row.subject,
    preheader: row.preheader,
    body: row.body,
    ctaCopy: row.cta_copy,
    writingStyle: row.writing_style_author ?? row.writing_style ?? null,
    recipients: [],
    sentAt: null,
    createdAt: row.created_at,
    status: 'pending',
    metrics: { ...EMPTY_METRICS },
    variables: fromGeneratedEmailRow(row),
  }
}
