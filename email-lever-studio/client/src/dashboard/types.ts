import type { EmailVariableSnapshot } from '../../../shared/email-variables.ts'
import type { SocialProofAssets } from '../../../shared/schema.ts'
import type { CampaignGoal, SocialProofStatus } from '../lib/database.types'
import {
  ENGAGEMENT_KEYS,
  type EngagementKey,
} from './engagement/constants'

export type EmailStatus = 'sent' | 'pending'

export type EmailRecipient = {
  id: string
  name: string
  email: string
  avatar?: string | null
}

export type RecipientContext = {
  segment?: string
  industry?: string
  role?: string
  seniority?: string
  companyName?: string
}

export type EmailMetrics = {
  sent: number
  opens: number
  openRate: number
  clicks: number
  clickRate: number
  replies: number
  replyRate: number
  conversions: number
  delivered?: number
  revenue?: number
  unsubscribed?: boolean
}

export type CampaignEmail = {
  id: string
  campaignId: string
  subject: string
  preheader?: string | null
  body: string
  ctaCopy?: string | null
  writingStyle?: string | null
  recipients: EmailRecipient[]
  recipientContext?: RecipientContext
  proofAssets?: SocialProofAssets
  sentAt: string | null
  /** When the draft was created; used to sort pending emails newest-first. */
  createdAt?: string | null
  status: EmailStatus
  metrics: EmailMetrics
  variables: EmailVariableSnapshot
}

export type Company = {
  id: string
  name: string
}

export type { CampaignGoal, SocialProofStatus } from '../lib/database.types'

export type Campaign = {
  id: string
  name: string
  companyId: string
  companyName: string
  status: 'active' | 'paused' | 'completed'
  emailCount: number
  productDescription?: string | null
  productUrl?: string | null
  goal?: CampaignGoal | null
  socialProofAssets?: SocialProofAssets
  /** Undefined = legacy campaign created before the brief flow (treated as ready). */
  socialProofStatus?: SocialProofStatus
}

/** Fields a user can edit on a campaign brief before generation is unlocked. */
export type CampaignBriefUpdate = {
  productDescription?: string | null
  productUrl?: string | null
  goal?: CampaignGoal | null
  socialProofAssets?: SocialProofAssets
  socialProofStatus?: SocialProofStatus
}

/**
 * True when a campaign has finished the brief flow and email generation should
 * be unlocked. Legacy campaigns (no `socialProofStatus`) are treated as ready.
 */
export function isCampaignSetupComplete(campaign: Campaign): boolean {
  return (
    campaign.socialProofStatus == null ||
    campaign.socialProofStatus === 'approved'
  )
}

export type CampaignActivity = {
  totalSent: number
  totalDelivered: number
  totalOpens: number
  totalClicks: number
  totalReplies: number
  avgOpenRate: number
  avgClickRate: number
  avgReplyRate: number
}

/** Inclusive min/max percent bounds for one engagement signal; `null` = no bound. */
export type EngagementRangeFilter = {
  min: number | null
  max: number | null
}

/** Default engagement range — matches any percentage. */
export const EMPTY_ENGAGEMENT_RANGE: EngagementRangeFilter = { min: null, max: null }

/** Fresh engagement filter map with every signal set to {@link EMPTY_ENGAGEMENT_RANGE}. */
export function createEmptyEngagementFilters(): Record<
  EngagementKey,
  EngagementRangeFilter
> {
  return Object.fromEntries(
    ENGAGEMENT_KEYS.map((key) => [key, { ...EMPTY_ENGAGEMENT_RANGE }]),
  ) as Record<EngagementKey, EngagementRangeFilter>
}

export type EmailFilters = {
  status: EmailStatus | 'all'
  engagement: Record<EngagementKey, EngagementRangeFilter>
  intent: string | null
  framework: string | null
  emotion: string | null
  persuasion: string | null
  specificity: string | null
  personalization: string | null
  ctaType: string | null
  socialProofType: string | null
  bodyLength: string | null
  writingStyle: string | null
  hasOffer: 'yes' | 'no' | null
}

export const DEFAULT_FILTERS: EmailFilters = {
  status: 'all',
  engagement: createEmptyEngagementFilters(),
  intent: null,
  framework: null,
  emotion: null,
  persuasion: null,
  specificity: null,
  personalization: null,
  ctaType: null,
  socialProofType: null,
  bodyLength: null,
  writingStyle: null,
  hasOffer: null,
}

export type ConnectedEmailSettings = {
  connected: boolean
  email: string | null
  unipileAccountId?: string | null
  provider?: string | null
  status?: string | null
}

/** Drill-down signal for recipient-level engagement (matches {@link EngagementKey}). */
export type EngagementSignal = EngagementKey

export type RecipientClickedLink = {
  id: string
  url: string
  label?: string
  clickedAt: string
}

/** Per-recipient engagement events for an email send. */
export type RecipientEngagement = {
  recipientId: string
  emailId: string
  name: string
  email: string
  deliveredAt?: string
  openedAt?: string
  clickedLinks?: RecipientClickedLink[]
  repliedAt?: string
  threadId?: string
}

/** A single message in a recipient email thread. */
export type EmailThreadMessage = {
  id: string
  threadId: string
  direction: 'outbound' | 'inbound'
  from: string
  to: string[]
  subject?: string
  body: string
  sentAt: string
}
