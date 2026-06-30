import express from 'express'
import cors from 'cors'
import { suggestLeversHandler } from './routes/suggest-levers.js'
import { generateDraftHandler } from './routes/generate-draft.js'

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
