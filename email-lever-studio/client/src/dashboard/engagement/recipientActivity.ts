import type {
  CampaignEmail,
  EmailThreadMessage,
  EngagementSignal,
  RecipientEngagement,
} from '../types'
import { ENGAGEMENT_KEYS, ENGAGEMENT_LABELS } from './constants'

const BULK_ENGAGEMENT_NAMES = [
  'Sarah Chen',
  'Marcus Webb',
  'Priya Patel',
  'Tom Richards',
  'Alex Morgan',
  'Jordan Lee',
  'Mia Chen',
  'Chris Ortiz',
  'Riley Brooks',
  'Sam Patel',
  'Taylor Wu',
  'Nina Kowalski',
]

function addMinutes(iso: string, minutes: number): string {
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  date.setMinutes(date.getMinutes() + minutes)
  return date.toISOString()
}

function buildBulkEmailEngagement(emailId: string, count: number) {
  const deliveredAt = '2026-03-18T09:45:00'

  return Array.from({ length: count }, (_, index): RecipientEngagement => {
    const name =
      BULK_ENGAGEMENT_NAMES[index] ?? `Enterprise Prospect ${index + 1}`
    const emailSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '.')
    const opened = index < 48
    const clicked = index < 12
    const replied = index < 6

    return {
      recipientId: `bulk-rcp-${index + 1}`,
      emailId,
      name,
      email: `${emailSlug}@acmecorp.com`,
      deliveredAt,
      openedAt: opened ? addMinutes(deliveredAt, 2 + index * 3) : undefined,
      clickedLinks: clicked
        ? [
            {
              id: `lnk-${index + 1}-case-study`,
              url: 'https://example.com/case-study',
              label: 'Case study',
              clickedAt: addMinutes(deliveredAt, 8 + index * 4),
            },
            ...(index % 3 === 0
              ? [
                  {
                    id: `lnk-${index + 1}-book-call`,
                    url: 'https://example.com/book',
                    label: 'Book a call',
                    clickedAt: addMinutes(deliveredAt, 16 + index * 4),
                  },
                ]
              : []),
          ]
        : undefined,
      repliedAt: replied ? addMinutes(deliveredAt, 90 + index * 12) : undefined,
      threadId: `thread-${emailId}-bulk-rcp-${index + 1}`,
    }
  })
}

function buildBulkReplyThreads(emailId: string): Record<string, EmailThreadMessage[]> {
  const deliveredAt = '2026-03-18T09:45:00'
  const replies = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@acmecorp.com',
      reply:
        'This is interesting. We are reviewing outbound experiments this quarter. Can you send the beverage case study?',
      followUp:
        'Absolutely. I can send the short case study and the benchmark summary. If useful, I can also point out the exact sequence changes that drove the lift.',
    },
    {
      name: 'Marcus Webb',
      email: 'marcus.webb@acmecorp.com',
      reply:
        'Open to looking. We have a pipeline review next week, so timing is good. What kind of brands was this tested with?',
      followUp:
        'Mostly enterprise beverage and retail teams with field sales motion. The closest example is a team selling into regional distributors.',
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@acmecorp.com',
      reply:
        'Could be relevant. Please send over the numbers first, then I can decide who should join a call.',
      followUp:
        'Makes sense. I will send the numbers and include the assumptions behind the 32% meeting-book-rate lift.',
    },
    {
      name: 'Tom Richards',
      email: 'tom.richards@acmecorp.com',
      reply:
        'Thanks. We already have a vendor here, but I would still like to see the playbook if it is concise.',
      followUp:
        'Totally fair. I can keep it concise: one page with the lever changes, test size, and before/after reply-to-meeting ratio.',
    },
    {
      name: 'Alex Morgan',
      email: 'alex.morgan@acmecorp.com',
      reply:
        'Looping in our demand gen lead. The question for us is whether this works outside enterprise accounts.',
      followUp:
        'Good question. I can include one enterprise example and one mid-market example so the comparison is clear.',
    },
    {
      name: 'Jordan Lee',
      email: 'jordan.lee@acmecorp.com',
      reply:
        'Can you share availability for Thursday? If the case study is relevant, I can do 15 minutes.',
      followUp:
        'Thursday works. I can do 10:30 or 14:00. I will send the case study before then so you can skim it first.',
    },
  ]

  return Object.fromEntries(
    replies.map((item, index) => {
      const recipientId = `bulk-rcp-${index + 1}`
      const threadId = `thread-${emailId}-${recipientId}`
      const inboundAt = addMinutes(deliveredAt, 90 + index * 12)

      return [
        threadId,
        [
          {
            id: `${threadId}-out-1`,
            threadId,
            direction: 'outbound',
            from: 'outreach@cocacola.com',
            to: [item.email],
            subject: 'Quick idea for your Q1 pipeline',
            body:
              'We noticed your team is scaling outbound — happy to share what worked for similar brands.\n\nWould a 15-min call next week make sense?',
            sentAt: deliveredAt,
          },
          {
            id: `${threadId}-in-1`,
            threadId,
            direction: 'inbound',
            from: item.email,
            to: ['outreach@cocacola.com'],
            subject: 'Re: Quick idea for your Q1 pipeline',
            body: item.reply,
            sentAt: inboundAt,
          },
          {
            id: `${threadId}-out-2`,
            threadId,
            direction: 'outbound',
            from: 'outreach@cocacola.com',
            to: [item.email],
            subject: 'Re: Quick idea for your Q1 pipeline',
            body: item.followUp,
            sentAt: addMinutes(inboundAt, 18),
          },
        ],
      ]
    }),
  )
}

/** Mock recipient engagement rows keyed by email id. */
const MOCK_RECIPIENT_ENGAGEMENT: Record<string, RecipientEngagement[]> = {
  'email-1': buildBulkEmailEngagement('email-1', 100),
  'email-2': [
    {
      recipientId: 'eng-2-1',
      emailId: 'email-2',
      name: 'Marcus Webb',
      email: 'marcus.webb@retailco.com',
      deliveredAt: '2026-03-22T14:30:00',
      openedAt: '2026-03-22T15:02:00',
      threadId: 'thread-email-2-eng-2-1',
    },
    {
      recipientId: 'eng-2-2',
      emailId: 'email-2',
      name: 'Priya Patel',
      email: 'priya.patel@retailco.com',
      deliveredAt: '2026-03-22T14:30:00',
      openedAt: '2026-03-22T16:45:00',
      threadId: 'thread-email-2-eng-2-2',
    },
  ],
}

const MOCK_THREAD_MESSAGES: Record<string, EmailThreadMessage[]> = {
  ...buildBulkReplyThreads('email-1'),
  'thread-email-1-eng-1-1': [
    {
      id: 'msg-1-1-out',
      threadId: 'thread-email-1-eng-1-1',
      direction: 'outbound',
      from: 'outreach@cocacola.com',
      to: ['sarah.kim@acmecorp.com'],
      subject: 'Quick idea for your Q1 pipeline',
      body: 'We noticed your team is scaling outbound — happy to share what worked for similar brands.\n\nWould a 15-min call next week make sense?',
      sentAt: '2026-03-18T09:45:00',
    },
  ],
  'thread-email-1-eng-1-6': [
    {
      id: 'msg-1-6-out',
      threadId: 'thread-email-1-eng-1-6',
      direction: 'outbound',
      from: 'outreach@cocacola.com',
      to: ['mia.chen@acmecorp.com'],
      subject: 'Quick idea for your Q1 pipeline',
      body: 'We noticed your team is scaling outbound — happy to share what worked for similar brands.\n\nWould a 15-min call next week make sense?',
      sentAt: '2026-03-18T09:45:00',
    },
    {
      id: 'msg-1-6-in',
      threadId: 'thread-email-1-eng-1-6',
      direction: 'inbound',
      from: 'mia.chen@acmecorp.com',
      to: ['outreach@cocacola.com'],
      subject: 'Re: Quick idea for your Q1 pipeline',
      body: 'Thanks for reaching out — could you send over the case study first? Then we can find time.',
      sentAt: '2026-03-18T16:05:00',
    },
  ],
}

function threadIdFor(emailId: string, recipientId: string) {
  return `thread-${emailId}-${recipientId}`
}

/** Build fallback engagement rows from email recipients when no mock exists. */
function buildFallbackEngagement(email: CampaignEmail): RecipientEngagement[] {
  const baseTime = email.sentAt ?? new Date().toISOString()
  return email.recipients.map((recipient, index) => {
    const deliveredAt = baseTime
    const opened = index === 0
    const clicked = index === 0
    const replied = index === 0 && email.metrics.replies > 0

    return {
      recipientId: recipient.id,
      emailId: email.id,
      name: recipient.name,
      email: recipient.email,
      deliveredAt,
      openedAt: opened ? addMinutes(deliveredAt, 15 + index * 5) : undefined,
      clickedLinks: clicked
        ? [
            {
              id: `lnk-fallback-${recipient.id}`,
              url: 'https://example.com/link',
              label: 'CTA link',
              clickedAt: addMinutes(deliveredAt, 30),
            },
          ]
        : undefined,
      repliedAt: replied ? addMinutes(deliveredAt, 120) : undefined,
      threadId: threadIdFor(email.id, recipient.id),
    }
  })
}

function recipientMatchesSignal(
  row: RecipientEngagement,
  signal: EngagementSignal,
): boolean {
  switch (signal) {
    case 'delivered':
      return row.deliveredAt != null
    case 'opened':
      return row.openedAt != null
    case 'clicked':
      return (row.clickedLinks?.length ?? 0) > 0
    case 'replied':
      return row.repliedAt != null
    default:
      return false
  }
}

/** All mock recipient engagement rows for an email. */
export function getRecipientEngagementForEmail(
  email: CampaignEmail,
): RecipientEngagement[] {
  const stored = MOCK_RECIPIENT_ENGAGEMENT[email.id]
  if (stored) return stored
  if (email.status !== 'sent') return []
  return buildFallbackEngagement(email)
}

/** Recipients matching a drill-down signal, sorted by most recent activity. */
export function getRecipientEngagementBySignal(
  email: CampaignEmail,
  signal: EngagementSignal,
): RecipientEngagement[] {
  return getRecipientEngagementForEmail(email)
    .filter((row) => recipientMatchesSignal(row, signal))
    .sort((a, b) => {
      const aTime = getRecipientLastActivityAt(a, signal)
      const bTime = getRecipientLastActivityAt(b, signal)
      if (!aTime && !bTime) return 0
      if (!aTime) return 1
      if (!bTime) return -1
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })
}

/** Count recipients per engagement signal for modal tabs. */
export function getEngagementSignalCounts(
  email: CampaignEmail,
): Record<EngagementSignal, number> {
  const rows = getRecipientEngagementForEmail(email)
  return Object.fromEntries(
    ENGAGEMENT_KEYS.map((signal) => [
      signal,
      rows.filter((row) => recipientMatchesSignal(row, signal)).length,
    ]),
  ) as Record<EngagementSignal, number>
}

/** Thread messages for a recipient; empty when no thread id. */
export function getThreadMessages(
  threadId: string | undefined,
): EmailThreadMessage[] {
  if (!threadId) return []
  return MOCK_THREAD_MESSAGES[threadId] ?? []
}

/** Build the outbound message from the campaign email when thread mock is missing. */
export function buildOutboundThreadMessage(
  email: CampaignEmail,
  recipient: RecipientEngagement,
): EmailThreadMessage {
  return {
    id: `outbound-${email.id}-${recipient.recipientId}`,
    threadId: recipient.threadId ?? threadIdFor(email.id, recipient.recipientId),
    direction: 'outbound',
    from: 'outreach@cocacola.com',
    to: [recipient.email],
    subject: email.subject,
    body: email.body,
    sentAt: recipient.deliveredAt ?? email.sentAt ?? new Date().toISOString(),
  }
}

/** Resolve full thread: mock messages or synthetic outbound from the email card. */
export function getThreadForRecipient(
  email: CampaignEmail,
  recipient: RecipientEngagement,
): EmailThreadMessage[] {
  const stored = getThreadMessages(recipient.threadId)
  if (stored.length > 0) return stored
  if (recipient.deliveredAt || email.status === 'sent') {
    return [buildOutboundThreadMessage(email, recipient)]
  }
  return []
}

/** ISO timestamp for the row's last relevant activity in the active tab. */
export function getRecipientLastActivityAt(
  row: RecipientEngagement,
  signal: EngagementSignal,
): string | null {
  switch (signal) {
    case 'delivered':
      return row.deliveredAt ?? null
    case 'opened':
      return row.openedAt ?? null
    case 'clicked': {
      const links = row.clickedLinks ?? []
      if (links.length === 0) return null
      return links.reduce((latest, link) =>
        new Date(link.clickedAt) > new Date(latest.clickedAt) ? link : latest,
      ).clickedAt
    }
    case 'replied':
      return row.repliedAt ?? null
    default:
      return null
  }
}

/** Format time as HH:mm for list rows. */
export function formatActivityTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`)
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

/** Modal title label for a signal tab. */
export function getEngagementSignalLabel(signal: EngagementSignal): string {
  return ENGAGEMENT_LABELS[signal]
}

/** Tab order for the engagement modal. */
export const ENGAGEMENT_MODAL_SIGNALS: EngagementSignal[] = [...ENGAGEMENT_KEYS]
