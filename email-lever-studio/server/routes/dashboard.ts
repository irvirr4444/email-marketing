import type { Request, Response } from 'express'
import { fromLeverSuggestion } from '../../shared/email-variables.ts'
import type { EmailDraft, LeverSuggestion } from '../../shared/schema.ts'
import { STYLE_AUTHOR_LABELS, type StyleKey } from '../../shared/writing-styles.ts'
import {
  addEmail,
  approveEmail,
  findCampaign,
  listCampaigns,
  listEmailsForCampaign,
  updateEmail,
} from '../dashboard/store.ts'
import type { CampaignEmail } from '../../client/src/dashboard/types.ts'

export function listCampaignsHandler(_req: Request, res: Response) {
  res.json(listCampaigns())
}

export function listCampaignEmailsHandler(req: Request, res: Response) {
  const { campaignId } = req.params
  if (!findCampaign(campaignId)) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }
  res.json(listEmailsForCampaign(campaignId))
}

export function approveEmailHandler(req: Request, res: Response) {
  const email = approveEmail(req.params.emailId)
  if (!email) {
    res.status(404).json({ error: 'Email not found' })
    return
  }
  res.json(email)
}

export function patchEmailHandler(req: Request, res: Response) {
  const { subject, preheader, body, recipients } = req.body as Partial<
    Pick<CampaignEmail, 'subject' | 'preheader' | 'body' | 'recipients'>
  >
  const email = updateEmail(req.params.emailId, {
    subject,
    preheader,
    body,
    recipients,
  })
  if (!email) {
    res.status(404).json({ error: 'Email not found' })
    return
  }
  res.json(email)
}

type SaveEmailBody = {
  campaignId: string
  draft: EmailDraft
  levers: LeverSuggestion
  styleKey?: StyleKey
  recipients?: CampaignEmail['recipients']
}

export function saveGeneratedEmailHandler(req: Request, res: Response) {
  const body = req.body as SaveEmailBody
  if (!body.campaignId || !body.draft || !body.levers) {
    res.status(400).json({ error: 'campaignId, draft, and levers are required' })
    return
  }
  if (!findCampaign(body.campaignId)) {
    res.status(404).json({ error: 'Campaign not found' })
    return
  }

  const variables = fromLeverSuggestion(body.levers, body.styleKey ?? null)
  const email: CampaignEmail = {
    id: `email-${Date.now()}`,
    campaignId: body.campaignId,
    subject: body.draft.subject,
    preheader: body.draft.preheader ?? null,
    body: body.draft.body,
    ctaCopy: body.levers.cta.ctaCopy,
    writingStyle: body.styleKey
      ? STYLE_AUTHOR_LABELS[body.styleKey as StyleKey]
      : null,
    recipients: body.recipients ?? [
      {
        id: `rcp-${Date.now()}`,
        name: 'Prospect',
        email: 'prospect@example.com',
      },
    ],
    sentAt: null,
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
    variables,
  }

  res.status(201).json(addEmail(email))
}
