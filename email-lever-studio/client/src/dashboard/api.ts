import type { Campaign, CampaignEmail } from './types'

export type UnipileAccount = {
  id: string
  email?: string | null
  username?: string | null
  name?: string | null
  provider?: string | null
  type?: string | null
  status?: string | null
}

export type UnipileAccountsResponse = {
  accounts: UnipileAccount[]
  cursor: string | null
}

export type UnipileHostedAuthLinkResponse = {
  url: string
}

const USE_MOCK =
  import.meta.env.VITE_USE_MOCK_DASHBOARD === 'false'
    ? false
    : import.meta.env.VITE_USE_MOCK_DASHBOARD === 'true' ||
      import.meta.env.VITE_USE_MOCK_DASHBOARD === true ||
      import.meta.env.DEV

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export function isMockDashboard() {
  return USE_MOCK
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  return fetchJson<Campaign[]>('/api/dashboard/campaigns')
}

export async function fetchCampaignEmails(
  campaignId: string,
): Promise<CampaignEmail[]> {
  return fetchJson<CampaignEmail[]>(
    `/api/dashboard/campaigns/${encodeURIComponent(campaignId)}/emails`,
  )
}

export async function approveEmail(emailId: string): Promise<CampaignEmail> {
  return fetchJson<CampaignEmail>(
    `/api/dashboard/emails/${encodeURIComponent(emailId)}/approve`,
    { method: 'POST' },
  )
}

export async function patchEmail(
  emailId: string,
  patch: Partial<
    Pick<CampaignEmail, 'subject' | 'preheader' | 'body' | 'recipients'>
  >,
): Promise<CampaignEmail> {
  return fetchJson<CampaignEmail>(
    `/api/dashboard/emails/${encodeURIComponent(emailId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    },
  )
}

export type SaveEmailPayload = {
  campaignId: string
  draft: { subject: string; preheader?: string; body: string }
  levers: unknown
  styleKey?: string
  recipients?: CampaignEmail['recipients']
}

export async function saveGeneratedEmail(
  payload: SaveEmailPayload,
): Promise<CampaignEmail> {
  return fetchJson<CampaignEmail>('/api/dashboard/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function fetchUnipileAccounts(): Promise<UnipileAccountsResponse> {
  return fetchJson<UnipileAccountsResponse>('/api/unipile/accounts')
}

export async function createUnipileHostedAuthLink(
  name: string,
): Promise<UnipileHostedAuthLinkResponse> {
  return fetchJson<UnipileHostedAuthLinkResponse>(
    '/api/unipile/hosted-auth-link',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    },
  )
}
