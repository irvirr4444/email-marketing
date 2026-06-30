import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import OpenAI from 'openai'

const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config({ path: resolve(__dirname, '../.env') })

if (!process.env.OPENAI_API_KEY) {
  console.error(
    'Missing OPENAI_API_KEY. Add it to the repo root .env or email-lever-studio/.env',
  )
  process.exit(1)
}

export const OPENAI_MODEL = 'gpt-4o-mini'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
