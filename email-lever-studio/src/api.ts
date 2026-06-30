import type { ColdContext, EmailDraft, LeverSuggestion } from './types'

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as T & { error?: string }

  if (!res.ok) {
    throw new Error(data.error ?? 'Request failed')
  }

  return data
}

export function suggestLevers(
  context: ColdContext,
  levers?: LeverSuggestion,
): Promise<LeverSuggestion> {
  return postJson<LeverSuggestion>('/api/suggest-levers', { context, levers })
}

export function generateDraft(
  context: ColdContext,
  levers: LeverSuggestion,
): Promise<EmailDraft> {
  return postJson<EmailDraft>('/api/generate-draft', { context, levers })
}
