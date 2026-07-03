import type { EmailVariableSnapshot } from '../../../shared/email-variables.ts'
import type { SocialProofAssets } from '../../../shared/schema.ts'

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
  status: EmailStatus
  metrics: EmailMetrics
  variables: EmailVariableSnapshot
}

export type Campaign = {
  id: string
  name: string
  companyName: string
  status: 'active' | 'paused' | 'completed'
  emailCount: number
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

export type EngagementFilter = boolean | null

export type EmailFilters = {
  status: EmailStatus | 'all'
  engagement: {
    delivered: EngagementFilter
    opened: EngagementFilter
    clicked: EngagementFilter
    replied: EngagementFilter
  }
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
  engagement: {
    delivered: null,
    opened: null,
    clicked: null,
    replied: null,
  },
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
}
