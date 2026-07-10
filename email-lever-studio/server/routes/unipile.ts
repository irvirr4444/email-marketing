import type { Request, Response } from 'express'

const DEFAULT_PROVIDER_SCOPE = '*:MAILING'

function getUnipileConfig() {
  const apiKey = process.env.UNIPILE_API_KEY?.trim()
  const apiUrl = process.env.UNIPILE_API_URL?.trim().replace(/\/+$/, '')

  if (!apiKey || !apiUrl) {
    return {
      ok: false as const,
      error: 'UNIPILE_API_KEY and UNIPILE_API_URL must be configured.',
    }
  }

  return { ok: true as const, apiKey, apiUrl }
}

async function readJsonResponse(res: globalThis.Response) {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return { body: text }
  }
}

function sendUnipileError(res: Response, status: number, data: unknown) {
  const detail =
    data && typeof data === 'object'
      ? ((data as { title?: string; error?: string }).title ??
        (data as { title?: string; error?: string }).error)
      : null

  const authHint =
    status === 401
      ? ' Check that UNIPILE_API_KEY belongs to the same Unipile app/DSN as UNIPILE_API_URL.'
      : ''

  res.status(status).json({
    error: `Unipile request failed${detail ? `: ${detail}` : ''}.${authHint}`,
    details: data,
  })
}

async function requestUnipile(path: string, init?: RequestInit) {
  const config = getUnipileConfig()
  if (!config.ok) return config

  const res = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      accept: 'application/json',
      'X-API-KEY': config.apiKey,
      ...init?.headers,
    },
  })
  const data = await readJsonResponse(res)

  return {
    ok: res.ok,
    status: res.status,
    data,
  } as const
}

export async function listUnipileAccountsHandler(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const result = await requestUnipile('/api/v1/accounts')

    if (!result.ok) {
      if ('error' in result) {
        res.status(500).json({ error: result.error })
        return
      }

      sendUnipileError(res, result.status, result.data)
      return
    }

    const data = result.data
    const accounts =
      data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)
        ? (data as { items: unknown[] }).items
        : Array.isArray(data)
          ? data
          : []

    res.json({
      accounts,
      cursor:
        data && typeof data === 'object'
          ? ((data as { cursor?: string | null }).cursor ?? null)
          : null,
    })
  } catch (err) {
    console.error('unipile accounts error:', err)
    res.status(500).json({ error: 'Failed to fetch Unipile accounts.' })
  }
}

export async function createUnipileHostedAuthLinkHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const config = getUnipileConfig()
    if (!config.ok) {
      res.status(500).json({ error: config.error })
      return
    }

    const { name, providers } = req.body as {
      name?: string
      providers?: string | string[]
    }
    const expiresOn = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    const result = await requestUnipile('/api/v1/hosted/accounts/link', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'create',
        api_url: config.apiUrl,
        expiresOn,
        providers: providers ?? DEFAULT_PROVIDER_SCOPE,
        ...(name ? { name } : {}),
      }),
    })

    if (!result.ok) {
      if ('error' in result) {
        res.status(500).json({ error: result.error })
        return
      }

      sendUnipileError(res, result.status, result.data)
      return
    }

    res.json(result.data)
  } catch (err) {
    console.error('unipile hosted auth error:', err)
    res.status(500).json({ error: 'Failed to create Unipile hosted auth link.' })
  }
}
