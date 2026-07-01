import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import { suggestLeversHandler } from './routes/suggest-levers.js'
import { generateDraftHandler } from './routes/generate-draft.js'
import { researchSocialProofHandler } from './routes/research-social-proof.js'
import {
  banditPickHandler,
  banditLearnHandler,
  banditRecoveryHandler,
} from './routes/bandit.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = 3001
const HOST = '127.0.0.1'

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/suggest-levers', suggestLeversHandler)
app.post('/api/generate-draft', generateDraftHandler)
app.post('/api/research-social-proof', researchSocialProofHandler)

// Contextual bandit (proxied to the Python service in bandit_mvp/).
app.post('/api/bandit/pick', banditPickHandler)
app.post('/api/bandit/learn', banditLearnHandler)
app.get('/api/bandit/recovery', banditRecoveryHandler)

// Browser UI.
app.use(express.static(resolve(__dirname, '../public')))

const server = app.listen(PORT, HOST, () => {
  console.log(`API server running on http://${HOST}:${PORT}`)
})

server.on('error', (err) => {
  console.error('[api] server error:', err)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  console.error('[api] unhandled rejection:', err)
})

process.on('uncaughtException', (err) => {
  console.error('[api] uncaught exception:', err)
  process.exit(1)
})
