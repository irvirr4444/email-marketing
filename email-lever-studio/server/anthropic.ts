import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(__dirname, '../../.env') })
dotenv.config({ path: resolve(__dirname, '../.env') })

if (!process.env.CLAUDE_API_KEY) {
  console.error(
    'Missing CLAUDE_API_KEY. Add it to the repo root .env or email-lever-studio/.env',
  )
  process.exit(1)
}

export const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL ?? 'claude-sonnet-5'

const API_URL = 'https://api.anthropic.com/v1/messages'

type ToolUseBlock = {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

type MessageResponse = {
  content: Array<{ type: string; name?: string; input?: Record<string, unknown> }>
}

export async function completeStructuredJson(opts: {
  system: string
  user: string
  toolName: string
  schema: object
}): Promise<Record<string, unknown>> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
      tools: [
        {
          name: opts.toolName,
          description: 'Structured JSON response',
          input_schema: opts.schema,
        },
      ],
      tool_choice: { type: 'tool', name: opts.toolName },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`Anthropic API error ${res.status}: ${errBody}`)
  }

  const data = (await res.json()) as MessageResponse
  const toolBlock = data.content.find(
    (b): b is ToolUseBlock => b.type === 'tool_use' && b.name === opts.toolName,
  )

  if (!toolBlock?.input) {
    throw new Error('No structured response from AI.')
  }

  return toolBlock.input
}
