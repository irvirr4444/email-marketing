/**
 * Hand-authored types for the SigilAI workspace schema.
 * Mirrors db/schema.sql (migration 004). Covers the tables the client reads.
 */

export type CompanyMemberRole = 'owner' | 'admin' | 'member'
export type CampaignStatus = 'active' | 'paused' | 'completed'
export type CampaignGoal =
  | 'book_meeting'
  | 'drive_purchase'
  | 'get_reply'
  | 'click_to_page'
  | 'collect_info'
  | 'referral'
export type SocialProofStatus = 'not_started' | 'researched' | 'approved'

export type AppUserRow = {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CompanyRow = {
  id: string
  name: string
  slug: string | null
  created_by: string | null
  extras: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CompanyMemberRow = {
  id: string
  company_id: string
  user_id: string
  role: CompanyMemberRole
  created_at: string
}

export type CampaignRow = {
  id: string
  company_id: string
  name: string
  status: CampaignStatus
  default_writing_style_id: string | null
  product_description: string | null
  product_url: string | null
  goal: CampaignGoal | null
  social_proof_assets: Record<string, unknown>
  social_proof_status: SocialProofStatus
  created_by: string | null
  extras: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WritingStyleRow = {
  id: string
  key: string
  author_label: string
  description: string | null
  prompt: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type GeneratedEmailRow = {
  id: string
  batch_id: string
  campaign_id: string | null
  writing_style_id: string | null
  scenario_id: string
  scenario_label: string | null
  index_in_batch: number
  subject: string
  preheader: string | null
  body: string
  intent: string
  framework: string | null
  emotion: string | null
  persuasion: string | null
  writing_style: string | null
  cta_type: string | null
  cta_copy: string | null
  has_offer: boolean
  offer_type: string | null
  offer_magnitude: string | null
  created_at: string
}

export type GeneratedEmailSendRow = {
  id: string
  generated_email_id: string
  message_id: string
  created_at: string
}
