import type { EmailVariableSnapshot } from '../../../shared/email-variables.ts'
import { FRAMEWORK_VALUES } from '../../../shared/schema.ts'
import { deliveredCount, matchesEngagementFilters } from './engagement'
import type { Campaign, CampaignEmail, ConnectedEmailSettings, Company, EmailFilters } from './types'

export const MOCK_CONNECTED_EMAIL: ConnectedEmailSettings = {
  connected: true,
  email: 'outreach@cocacola.com',
}

export const MOCK_COMPANIES: Company[] = [
  { id: 'co-coca', name: 'Coca Cola' },
  { id: 'co-pepsi', name: 'PepsiCo' },
  { id: 'co-redbull', name: 'Red Bull' },
]

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Q1 Enterprise Outreach',
    companyId: 'co-coca',
    companyName: 'Coca Cola',
    status: 'active',
    emailCount: 4,
  },
  {
    id: 'camp-2',
    name: 'Product Launch — Retail',
    companyId: 'co-coca',
    companyName: 'Coca Cola',
    status: 'active',
    emailCount: 2,
  },
  {
    id: 'camp-3',
    name: 'Win-back Dormant Accounts',
    companyId: 'co-coca',
    companyName: 'Coca Cola',
    status: 'paused',
    emailCount: 1,
  },
  {
    id: 'camp-4',
    name: 'Summer Sampling Drive',
    companyId: 'co-pepsi',
    companyName: 'PepsiCo',
    status: 'active',
    emailCount: 2,
  },
  {
    id: 'camp-5',
    name: 'Energy Drink Launch',
    companyId: 'co-redbull',
    companyName: 'Red Bull',
    status: 'active',
    emailCount: 1,
  },
]

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'

const avatar = (slug: string) =>
  `https://www.untitledui.com/images/avatars/${slug}?fm=webp&q=80`

function buildMockSnapshot(
  partial: Partial<EmailVariableSnapshot> &
    Pick<EmailVariableSnapshot, 'intent' | 'framework'>,
): EmailVariableSnapshot {
  return {
    intent: partial.intent,
    framework: partial.framework,
    emotion: partial.emotion ?? 'curiosity',
    persuasion: partial.persuasion ?? 'reciprocity',
    specificity: partial.specificity ?? 'hard_numbers',
    personalization: partial.personalization ?? 'segment_tailored',
    writingStyle: partial.writingStyle ?? 'David Ogilvy',
    subjectType: partial.subjectType ?? 'statement',
    subjectLength: partial.subjectLength ?? 'medium',
    subjectCasing: partial.subjectCasing ?? 'sentence',
    preheaderPresent: partial.preheaderPresent ?? false,
    preheaderLength: partial.preheaderLength ?? null,
    preheaderRelationship: partial.preheaderRelationship ?? null,
    bodyLength: partial.bodyLength ?? 'medium',
    bodyLinks: partial.bodyLinks ?? 'zero',
    bodyScannable: partial.bodyScannable ?? true,
    socialProofType: partial.socialProofType ?? 'result',
    socialProofPlacement: partial.socialProofPlacement ?? 'body',
    socialProofSpecificity: partial.socialProofSpecificity ?? 'specific',
    ctaType: partial.ctaType ?? 'reply',
    ctaStyle: partial.ctaStyle ?? 'plain_reply_ask',
    ctaPlacement: partial.ctaPlacement ?? 'end',
    ctaCopy: partial.ctaCopy ?? '',
    hasOffer: partial.hasOffer ?? false,
    offerType: partial.offerType ?? null,
    offerMagnitude: partial.offerMagnitude ?? null,
  }
}

export const MOCK_EMAILS: CampaignEmail[] = [
  {
    id: 'email-1',
    campaignId: 'camp-1',
    subject: 'Quick idea for your Q1 pipeline',
    preheader: 'A 15-minute call could unlock your outbound playbook',
    recipients: [
      {
        id: 'rcp-1',
        name: 'Sarah Chen',
        email: 'sarah.chen@acmecorp.com',
        avatar: avatar('sarah-chow'),
      },
    ],
    recipientContext: {
      segment: 'cold_prospect',
      industry: 'beverages',
      role: 'VP Sales',
      seniority: 'VP/C-level',
      companyName: 'Acme Corp',
    },
    proofAssets: {
      recognizableCustomer: 'Fortune 500 beverage brand',
      specificResult: '32% lift in meeting book rate',
    },
    body: `${LOREM}\n\nWe noticed your team is scaling outbound — happy to share what worked for similar brands.\n\nWould a 15-min call next week make sense?`,
    ctaCopy: 'Open to a quick call next week?',
    writingStyle: 'David Ogilvy',
    sentAt: '2026-03-18T09:45:00',
    status: 'sent',
    metrics: {
      sent: 120,
      opens: 48,
      openRate: 40,
      clicks: 12,
      clickRate: 10,
      replies: 6,
      replyRate: 5,
      conversions: 2,
      delivered: 118,
      revenue: 24000,
    },
    variables: buildMockSnapshot({
      intent: 'book_meeting',
      framework: 'PAS',
      emotion: 'aspiration',
      persuasion: 'authority',
      specificity: 'hard_numbers',
      personalization: 'one_to_one_researched',
      writingStyle: 'David Ogilvy',
      subjectType: 'curiosity_gap',
      preheaderPresent: true,
      preheaderLength: 'short',
      preheaderRelationship: 'complements',
      bodyLength: 'medium',
      bodyLinks: 'one',
      socialProofType: 'result',
      socialProofPlacement: 'body',
      socialProofSpecificity: 'specific',
      ctaType: 'book',
      ctaStyle: 'plain_reply_ask',
      ctaPlacement: 'end',
      ctaCopy: 'Open to a quick call next week?',
    }),
  },
  {
    id: 'email-2',
    campaignId: 'camp-1',
    subject: 'Following up — case study inside',
    preheader: 'How a peer in beverages improved reply rates',
    recipients: [
      {
        id: 'rcp-2',
        name: 'Marcus Webb',
        email: 'marcus.webb@retailco.com',
        avatar: avatar('marcus-rasmussen'),
      },
      {
        id: 'rcp-3',
        name: 'Priya Patel',
        email: 'priya.patel@retailco.com',
        avatar: avatar('priya-shah'),
      },
    ],
    body: `${LOREM}\n\nAttaching a short case study from a peer in beverages.\n\nLet me know if you'd like the full breakdown.`,
    ctaCopy: 'Want the full case study?',
    writingStyle: 'Dan Kennedy',
    sentAt: '2026-03-22T14:30:00',
    status: 'sent',
    metrics: {
      sent: 95,
      opens: 30,
      openRate: 32,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
      delivered: 94,
    },
    variables: buildMockSnapshot({
      intent: 'get_reply',
      framework: 'AIDA',
      emotion: 'curiosity',
      persuasion: 'authority',
      specificity: 'vague',
      personalization: 'merge_field',
      writingStyle: 'Dan Kennedy',
      subjectType: 'statement',
      preheaderPresent: true,
      preheaderLength: 'medium',
      preheaderRelationship: 'complements',
      socialProofType: 'quote',
      socialProofPlacement: 'pre_cta',
      ctaType: 'reply',
      ctaCopy: 'Want the full case study?',
    }),
  },
  {
    id: 'email-3',
    campaignId: 'camp-1',
    subject: 'One metric your competitors track',
    recipients: [
      {
        id: 'rcp-4',
        name: 'James Okonkwo',
        email: 'j.okonkwo@globalbev.com',
        avatar: avatar('james-mitchell'),
      },
      {
        id: 'rcp-5',
        name: 'Elena Rossi',
        email: 'elena.rossi@globalbev.com',
        avatar: avatar('elena-martinez'),
      },
      {
        id: 'rcp-6',
        name: 'Tom Bradley',
        email: 'tom.bradley@globalbev.com',
        avatar: avatar('tom-cook'),
      },
    ],
    recipientContext: {
      segment: 'warm_lead',
      industry: 'beverages',
      role: 'Director of Marketing',
      seniority: 'Director',
      companyName: 'Global Bev Co',
    },
    body: `${LOREM}\n\nTeams in your space often benchmark reply-to-meeting ratio.\n\nWant me to send the benchmark sheet?`,
    ctaCopy: 'Should I send the benchmark sheet?',
    writingStyle: 'Frank Kern',
    sentAt: null,
    createdAt: '2026-03-24T11:00:00',
    status: 'pending',
    metrics: {
      sent: 0,
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
    },
    variables: buildMockSnapshot({
      intent: 'click_to_page',
      framework: 'BAB',
      emotion: 'curiosity',
      persuasion: 'reciprocity',
      specificity: 'hard_numbers',
      personalization: 'segment_tailored',
      writingStyle: 'Frank Kern',
      subjectType: 'question',
      bodyLength: 'short',
      socialProofType: 'consensus',
      socialProofPlacement: 'opener',
      ctaType: 'read',
      ctaStyle: 'link',
      ctaPlacement: 'inline',
      ctaCopy: 'Should I send the benchmark sheet?',
    }),
  },
  {
    id: 'email-4',
    campaignId: 'camp-1',
    subject: 'Draft — partnership intro',
    preheader: 'Exploring a co-marketing pilot for Q2',
    recipients: [
      {
        id: 'rcp-7',
        name: 'Nina Kowalski',
        email: 'nina.k@partnerhub.io',
        avatar: avatar('nina-wang'),
      },
      {
        id: 'rcp-8',
        name: 'David Park',
        email: 'david@partnerhub.io',
        avatar: avatar('david-kim'),
      },
      {
        id: 'rcp-9',
        name: 'Amira Hassan',
        email: 'amira@partnerhub.io',
        avatar: avatar('amira-hassan'),
      },
      {
        id: 'rcp-10',
        name: 'Chris Doyle',
        email: 'chris@partnerhub.io',
        avatar: avatar('chris-lee'),
      },
    ],
    proofAssets: {
      customerQuote: '"Their team moved faster than any partner we have worked with."',
      recentWin: 'Signed 3 retail pilots in March',
    },
    body: `${LOREM}\n\nDraft for review before send.`,
    ctaCopy: 'Worth a 20-minute intro call?',
    writingStyle: 'Andre Chaperon',
    sentAt: null,
    createdAt: '2026-03-21T09:30:00',
    status: 'pending',
    metrics: {
      sent: 0,
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
    },
    variables: buildMockSnapshot({
      intent: 'referral',
      framework: 'Star-Story-Solution',
      emotion: 'aspiration',
      persuasion: 'liking',
      specificity: 'vague',
      personalization: 'generic',
      writingStyle: 'Andre Chaperon',
      subjectType: 'announcement',
      preheaderPresent: true,
      preheaderLength: 'short',
      preheaderRelationship: 'repeats',
      socialProofType: 'quote',
      socialProofPlacement: 'body',
      socialProofSpecificity: 'specific',
      ctaType: 'book',
      ctaCopy: 'Worth a 20-minute intro call?',
    }),
  },
  {
    id: 'email-5',
    campaignId: 'camp-2',
    subject: 'Retail launch — pilot stores',
    preheader: 'Limited pilot slots for the new SKU rollout',
    recipients: [
      {
        id: 'rcp-11',
        name: 'Olivia Rhye',
        email: 'olivia.rhye@megastore.com',
        avatar: avatar('olivia-rhye'),
      },
    ],
    body: `${LOREM}\n\nWe're opening pilot slots for the new SKU rollout.`,
    ctaCopy: 'Reserve a pilot slot',
    writingStyle: 'Dan Kennedy',
    sentAt: '2026-03-10T11:20:00',
    status: 'sent',
    metrics: {
      sent: 200,
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
      delivered: 198,
      revenue: 0,
    },
    variables: buildMockSnapshot({
      intent: 'drive_purchase',
      framework: 'PAS',
      emotion: 'fomo',
      persuasion: 'scarcity',
      specificity: 'hard_numbers',
      writingStyle: 'Dan Kennedy',
      preheaderPresent: true,
      preheaderLength: 'short',
      preheaderRelationship: 'complements',
      socialProofType: 'name_drop',
      ctaType: 'buy',
      ctaStyle: 'button',
      hasOffer: true,
      offerType: 'percent_off',
      offerMagnitude: '15%',
      ctaCopy: 'Reserve a pilot slot',
    }),
  },
  {
    id: 'email-6',
    campaignId: 'camp-2',
    subject: 'Shelf placement data',
    recipients: [
      {
        id: 'rcp-12',
        name: 'Lana Steiner',
        email: 'lana@freshmart.com',
        avatar: avatar('lana-steiner'),
      },
      {
        id: 'rcp-13',
        name: 'Phoenix Baker',
        email: 'phoenix@freshmart.com',
        avatar: avatar('phoenix-baker'),
      },
    ],
    body: `${LOREM}\n\nSharing placement lift from last quarter.`,
    ctaCopy: 'Book 15 minutes to review the data',
    writingStyle: 'David Ogilvy',
    sentAt: '2026-03-14T16:05:00',
    status: 'sent',
    metrics: {
      sent: 180,
      opens: 54,
      openRate: 30,
      clicks: 15,
      clickRate: 8.3,
      replies: 0,
      replyRate: 0,
      conversions: 0,
      delivered: 177,
    },
    variables: buildMockSnapshot({
      intent: 'book_meeting',
      framework: 'AIDA',
      emotion: 'status',
      persuasion: 'authority',
      specificity: 'hard_numbers',
      socialProofType: 'result',
      socialProofPlacement: 'pre_cta',
      ctaType: 'book',
      ctaCopy: 'Book 15 minutes to review the data',
    }),
  },
  {
    id: 'email-7',
    campaignId: 'camp-3',
    subject: 'We miss you — exclusive offer',
    preheader: 'Your bundle expires Friday',
    recipients: [
      {
        id: 'rcp-14',
        name: 'Caitlyn King',
        email: 'caitlyn@dormant-shop.com',
        avatar: avatar('caitlyn-king'),
      },
    ],
    body: `${LOREM}\n\nCome back with a limited-time bundle.`,
    ctaCopy: 'Claim your bundle',
    writingStyle: 'Ben Settle',
    sentAt: '2026-02-28T08:15:00',
    status: 'sent',
    metrics: {
      sent: 50,
      opens: 20,
      openRate: 40,
      clicks: 0,
      clickRate: 0,
      replies: 2,
      replyRate: 4,
      conversions: 0,
      delivered: 49,
      unsubscribed: true,
    },
    variables: buildMockSnapshot({
      intent: 'drive_purchase',
      framework: 'BAB',
      emotion: 'pain_relief',
      persuasion: 'scarcity',
      specificity: 'vague',
      writingStyle: 'Ben Settle',
      preheaderPresent: true,
      preheaderLength: 'short',
      preheaderRelationship: 'complements',
      socialProofType: 'recency',
      ctaType: 'buy',
      hasOffer: true,
      offerType: 'bundle',
      offerMagnitude: '2-for-1',
      ctaCopy: 'Claim your bundle',
    }),
  },
  {
    id: 'email-8',
    campaignId: 'camp-4',
    subject: 'Taste test invites — your stores',
    preheader: 'Free sampling kits for top-performing locations',
    recipients: [
      {
        id: 'rcp-15',
        name: 'Jordan Lee',
        email: 'jordan@retailpartners.com',
        avatar: avatar('jordan-baker'),
      },
    ],
    body: `${LOREM}\n\nWe're shipping sampling kits to select retail partners this month.`,
    ctaCopy: 'Reserve sampling kits',
    writingStyle: 'Dan Kennedy',
    sentAt: '2026-03-05T10:00:00',
    status: 'sent',
    metrics: {
      sent: 80,
      opens: 32,
      openRate: 40,
      clicks: 8,
      clickRate: 10,
      replies: 1,
      replyRate: 1.25,
      conversions: 0,
      delivered: 79,
    },
    variables: buildMockSnapshot({
      intent: 'drive_purchase',
      framework: 'AIDA',
      emotion: 'fomo',
      ctaType: 'buy',
      ctaCopy: 'Reserve sampling kits',
    }),
  },
  {
    id: 'email-9',
    campaignId: 'camp-4',
    subject: 'Pending — regional manager intro',
    recipients: [
      {
        id: 'rcp-16',
        name: 'Alex Morgan',
        email: 'alex@retailpartners.com',
        avatar: avatar('alex-morgan'),
      },
    ],
    body: `${LOREM}\n\nDraft for approval before regional rollout.`,
    ctaCopy: 'Open to a quick intro?',
    writingStyle: 'Frank Kern',
    sentAt: null,
    createdAt: '2026-03-19T08:00:00',
    status: 'pending',
    metrics: {
      sent: 0,
      opens: 0,
      openRate: 0,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
    },
    variables: buildMockSnapshot({
      intent: 'book_meeting',
      framework: 'PAS',
      ctaType: 'book',
      ctaCopy: 'Open to a quick intro?',
    }),
  },
  {
    id: 'email-10',
    campaignId: 'camp-5',
    subject: 'Fuel the season — partner preview',
    preheader: 'Early access for energy drink retail partners',
    recipients: [
      {
        id: 'rcp-17',
        name: 'Sam Rivera',
        email: 'sam@fitness-retail.com',
        avatar: avatar('sam-rivera'),
      },
    ],
    body: `${LOREM}\n\nPreview our Q2 partner bundle before public launch.`,
    ctaCopy: 'Get early access',
    writingStyle: 'Ben Settle',
    sentAt: '2026-03-01T15:30:00',
    status: 'sent',
    metrics: {
      sent: 60,
      opens: 24,
      openRate: 40,
      clicks: 0,
      clickRate: 0,
      replies: 0,
      replyRate: 0,
      conversions: 0,
      delivered: 60,
    },
    variables: buildMockSnapshot({
      intent: 'click_to_page',
      framework: 'BAB',
      emotion: 'aspiration',
      ctaType: 'read',
      ctaCopy: 'Get early access',
    }),
  },
]

export function getCampaignById(id: string): Campaign | undefined {
  return MOCK_CAMPAIGNS.find((c) => c.id === id)
}

export function getCompanyById(id: string): Company | undefined {
  return MOCK_COMPANIES.find((c) => c.id === id)
}

export function getCampaignsForCompany(companyId: string): Campaign[] {
  return MOCK_CAMPAIGNS.filter((c) => c.companyId === companyId)
}

export function getDefaultCampaignForCompany(
  companyId: string,
): Campaign | undefined {
  return getCampaignsForCompany(companyId)[0]
}

export function getEmailsForCampaign(campaignId: string): CampaignEmail[] {
  return sortEmails(MOCK_EMAILS.filter((e) => e.campaignId === campaignId))
}

export function sortEmails(emails: CampaignEmail[]): CampaignEmail[] {
  return [...emails].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'pending' ? -1 : 1
    }

    const aTime = new Date(a.sentAt ?? a.createdAt ?? 0).getTime()
    const bTime = new Date(b.sentAt ?? b.createdAt ?? 0).getTime()
    return bTime - aTime
  })
}

export function computeCampaignActivity(emails: CampaignEmail[]) {
  const sentEmails = emails.filter((e) => e.status === 'sent')
  const totals = sentEmails.reduce(
    (acc, e) => ({
      totalSent: acc.totalSent + e.metrics.sent,
      totalDelivered: acc.totalDelivered + deliveredCount(e.metrics, e.status),
      totalOpens: acc.totalOpens + e.metrics.opens,
      totalClicks: acc.totalClicks + e.metrics.clicks,
      totalReplies: acc.totalReplies + e.metrics.replies,
    }),
    {
      totalSent: 0,
      totalDelivered: 0,
      totalOpens: 0,
      totalClicks: 0,
      totalReplies: 0,
    },
  )

  const count = sentEmails.length || 1
  return {
    ...totals,
    avgOpenRate:
      sentEmails.reduce((s, e) => s + e.metrics.openRate, 0) / count,
    avgClickRate:
      sentEmails.reduce((s, e) => s + e.metrics.clickRate, 0) / count,
    avgReplyRate:
      sentEmails.reduce((s, e) => s + e.metrics.replyRate, 0) / count,
  }
}

export function filterEmails(
  emails: CampaignEmail[],
  filters: EmailFilters,
): CampaignEmail[] {
  const result = emails.filter((email) => {
    if (filters.status !== 'all' && email.status !== filters.status) {
      return false
    }
    if (!matchesEngagementFilters(email, filters.engagement)) {
      return false
    }
    if (filters.framework && email.variables.framework !== filters.framework) {
      return false
    }
    if (filters.intent && email.variables.intent !== filters.intent) {
      return false
    }
    if (filters.ctaType && email.variables.ctaType !== filters.ctaType) {
      return false
    }
    if (filters.emotion && email.variables.emotion !== filters.emotion) {
      return false
    }
    if (filters.persuasion && email.variables.persuasion !== filters.persuasion) {
      return false
    }
    if (filters.specificity && email.variables.specificity !== filters.specificity) {
      return false
    }
    if (
      filters.personalization &&
      email.variables.personalization !== filters.personalization
    ) {
      return false
    }
    if (
      filters.socialProofType &&
      email.variables.socialProofType !== filters.socialProofType
    ) {
      return false
    }
    if (filters.bodyLength && email.variables.bodyLength !== filters.bodyLength) {
      return false
    }
    if (
      filters.writingStyle &&
      email.variables.writingStyle !== filters.writingStyle
    ) {
      return false
    }
    if (filters.hasOffer === 'yes' && !email.variables.hasOffer) {
      return false
    }
    if (filters.hasOffer === 'no' && email.variables.hasOffer) {
      return false
    }
    return true
  })
  return sortEmails(result)
}

/** Framework values used in mock data — subset of schema for filter dropdown. */
export const FRAMEWORK_FILTER_OPTIONS = [
  'PAS',
  'AIDA',
  'BAB',
  'Star-Story-Solution',
] as const

export { FRAMEWORK_VALUES }
