import type { Request, Response } from 'express'

// The Python bandit service (bandit_mvp/service.py). Override with BANDIT_URL.
const BANDIT_URL = process.env.BANDIT_URL ?? 'http://127.0.0.1:8000'

async function forward(
  res: Response,
  path: string,
  init: RequestInit,
): Promise<void> {
  let upstream: globalThis.Response
  try {
    upstream = await fetch(`${BANDIT_URL}${path}`, init)
  } catch {
    res.status(502).json({
      error: `Bandit service unreachable at ${BANDIT_URL}. Start it with: cd bandit_mvp && uvicorn service:app --port 8000`,
    })
    return
  }
  const text = await upstream.text()
  res.status(upstream.status)
  res.type('application/json')
  res.send(text || '{}')
}

export async function banditPickHandler(req: Request, res: Response): Promise<void> {
  await forward(res, '/pick', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body ?? {}),
  })
}

export async function banditLearnHandler(req: Request, res: Response): Promise<void> {
  await forward(res, '/learn', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body ?? {}),
  })
}

export async function banditRecoveryHandler(req: Request, res: Response): Promise<void> {
  const trials = Number(req.query.trials ?? 2000)
  await forward(res, `/recovery?trials=${trials}`, { method: 'GET' })
}

export async function banditTrainHandler(req: Request, res: Response): Promise<void> {
  await forward(res, '/train', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req.body ?? {}),
  })
}
