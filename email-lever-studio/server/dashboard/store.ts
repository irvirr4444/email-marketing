import type { CampaignEmail } from '../../client/src/dashboard/types.ts'
import { MOCK_CAMPAIGNS, MOCK_EMAILS, sortEmails } from '../../client/src/dashboard/mock.ts'

/** In-memory store seeded from mock; replaced when DATABASE_URL is wired. */
let campaigns = structuredClone(MOCK_CAMPAIGNS)
let emails = structuredClone(MOCK_EMAILS)

export function listCampaigns() {
  return campaigns
}

export function listEmailsForCampaign(campaignId: string) {
  return sortEmails(emails.filter((e) => e.campaignId === campaignId))
}

export function findCampaign(campaignId: string) {
  return campaigns.find((c) => c.id === campaignId)
}

export function findEmail(emailId: string) {
  return emails.find((e) => e.id === emailId)
}

export function updateEmail(
  emailId: string,
  patch: Partial<
    Pick<CampaignEmail, 'subject' | 'preheader' | 'body' | 'recipients'>
  >,
) {
  const idx = emails.findIndex((e) => e.id === emailId)
  if (idx === -1) return null
  emails[idx] = { ...emails[idx], ...patch }
  return emails[idx]
}

export function approveEmail(emailId: string) {
  const idx = emails.findIndex((e) => e.id === emailId)
  if (idx === -1) return null
  const email = emails[idx]
  if (email.status !== 'pending') return email
  emails[idx] = {
    ...email,
    status: 'sent',
    sentAt: new Date().toISOString().slice(0, 10),
    metrics: {
      ...email.metrics,
      sent: 1,
    },
  }
  return emails[idx]
}

export function addEmail(email: CampaignEmail) {
  emails = [...emails, email]
  const campIdx = campaigns.findIndex((c) => c.id === email.campaignId)
  if (campIdx !== -1) {
    campaigns[campIdx] = {
      ...campaigns[campIdx],
      emailCount: campaigns[campIdx].emailCount + 1,
    }
  }
  return email
}

export function resetStore() {
  campaigns = structuredClone(MOCK_CAMPAIGNS)
  emails = structuredClone(MOCK_EMAILS)
}
