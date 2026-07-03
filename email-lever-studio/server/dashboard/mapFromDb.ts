import { fromGeneratedEmailRow } from '../../shared/email-variables.ts'
import type { SocialProofAssets } from '../../shared/schema.ts'
import type {
  Campaign,
  CampaignEmail,
  EmailMetrics,
  EmailRecipient,
  EmailStatus,
  RecipientContext,
} from '../../client/src/dashboard/types.ts'

export type GeneratedEmailRow = {
  id: string
  batch_id: string
  scenario_id: string
  scenario_label?: string | null
  index_in_batch: number
  subject: string
  preheader?: string | null
  body: string
  intent: string
  subject_type?: string | null
  subject_length?: string | null
  subject_casing?: string | null
  preheader_present?: boolean | null
  preheader_length?: string | null
  preheader_relationship?: string | null
  body_length?: string | null
  body_links?: string | null
  body_scannable?: boolean | null
  framework?: string | null
  emotion?: string | null
  persuasion?: string | null
  specificity?: string | null
  personalization_depth?: string | null
  writing_style?: string | null
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
  created_at?: string
}

export type GenerationBatchRow = {
  id: string
  batch_id: string
  company: string
  product: string
  campaign?: string | null
  social_proof_assets?: SocialProofAssets | null
  total_generated: number
  created_at?: string
}

export type EmailMessageRow = {
  id: string
  contact_id?: string | null
  subject?: string | null
  preheader?: string | null
  body_text?: string | null
  to_email?: string | null
  sent_at?: string | null
}

export type EmailMetricsRow = {
  message_id: string
  opened?: boolean | null
  clicked?: boolean | null
  replied?: boolean | null
  goal_completed?: boolean | null
  revenue?: number | null
  unsubscribed?: boolean | null
}

export type ContactRow = {
  id: string
  name?: string | null
  email?: string | null
}

export type ContactProfileRow = {
  contact_id: string
  industry?: string | null
  company_name?: string | null
  role?: string | null
  seniority?: string | null
}

export function mapBatchToCampaign(
  batch: GenerationBatchRow,
  emailCount: number,
): Campaign {
  const slug = batch.campaign ?? batch.batch_id
  return {
    id: batch.id,
    name: batch.campaign ?? batch.product,
    companyName: batch.company,
    status: 'active',
    emailCount,
  }
}

export function mapGeneratedEmailToCampaignEmail(
  row: GeneratedEmailRow,
  opts: {
    campaignId: string
    status?: EmailStatus
    sentAt?: string | null
    recipients?: EmailRecipient[]
    recipientContext?: RecipientContext
    proofAssets?: SocialProofAssets
    metrics?: EmailMetrics
  },
): CampaignEmail {
  const variables = fromGeneratedEmailRow(row)
  return {
    id: row.id,
    campaignId: opts.campaignId,
    subject: row.subject,
    preheader: row.preheader,
    body: row.body,
    ctaCopy: row.cta_copy,
    writingStyle: row.writing_style,
    recipients: opts.recipients ?? [],
    recipientContext: opts.recipientContext,
    proofAssets: opts.proofAssets,
    sentAt: opts.sentAt ?? null,
    status: opts.status ?? 'pending',
    metrics: opts.metrics ?? {
      sent: 0,
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
    },
    variables,
  }
}

export function mapSentMessageToCampaignEmail(
  message: EmailMessageRow,
  metrics: EmailMetricsRow | null,
  contact: ContactRow | null,
  profile: ContactProfileRow | null,
  analysis: GeneratedEmailRow | null,
  campaignId: string,
): CampaignEmail {
  const recipients: EmailRecipient[] = contact
    ? [
        {
          id: contact.id,
          name: contact.name ?? contact.email ?? 'Recipient',
          email: contact.email ?? '',
        },
      ]
    : []

  const baseMetrics: EmailMetrics = {
    sent: 1,
    opens: metrics?.opened ? 1 : 0,
    openRate: metrics?.opened ? 100 : 0,
    clicks: metrics?.clicked ? 1 : 0,
    clickRate: metrics?.clicked ? 100 : 0,
    replies: metrics?.replied ? 1 : 0,
    replyRate: metrics?.replied ? 100 : 0,
    conversions: metrics?.goal_completed ? 1 : 0,
    revenue: metrics?.revenue ?? undefined,
    unsubscribed: metrics?.unsubscribed ?? undefined,
  }

  if (analysis) {
    return mapGeneratedEmailToCampaignEmail(analysis, {
      campaignId,
      status: 'sent',
      sentAt: message.sent_at?.slice(0, 10) ?? null,
      recipients,
      recipientContext: profile
        ? {
            industry: profile.industry ?? undefined,
            role: profile.role ?? undefined,
            seniority: profile.seniority ?? undefined,
            companyName: profile.company_name ?? undefined,
          }
        : undefined,
      metrics: baseMetrics,
    })
  }

  return {
    id: message.id,
    campaignId,
    subject: message.subject ?? '(No subject)',
    preheader: message.preheader,
    body: message.body_text ?? '',
    recipients,
    sentAt: message.sent_at?.slice(0, 10) ?? null,
    status: 'sent',
    metrics: baseMetrics,
    variables: fromGeneratedEmailRow({
      intent: 'get_reply',
      framework: 'PAS',
    }),
  }
}
