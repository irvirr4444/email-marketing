#!/usr/bin/env npx tsx
import { mkdir, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cloneLeverSuggestion,
  INTENT_OPTIONS,
  type ColdContext,
  type EmailDraft,
  type IntentValue,
  type LeverSuggestion,
} from '../shared/schema.ts'
import { resolveStyle, type StyleKey } from './writing-styles.ts'

const API_BASE = 'http://127.0.0.1:3001'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, '../output')

type CliArgs = {
  company?: string
  product?: string
  campaign?: string
  intent?: string
  style?: string
  noFile: boolean
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { noFile: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--no-file') {
      args.noFile = true
      continue
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2) as keyof CliArgs
      const value = argv[++i]
      if (value && !value.startsWith('--')) {
        ;(args as Record<string, string | boolean>)[key] = value
      }
    }
  }

  return args
}

async function promptMissing(args: CliArgs): Promise<{
  company: string
  product: string
  campaign: string
  intent: IntentValue
  styleKey?: StyleKey
  noFile: boolean
}> {
  const rl = createInterface({ input, output })

  const company =
    args.company?.trim() ||
    (await rl.question('Company Name: ')).trim()
  const product =
    args.product?.trim() ||
    (await rl.question('Product Description: ')).trim()
  const campaign =
    args.campaign?.trim() ||
    (await rl.question('Campaign: ')).trim()

  let intent = args.intent?.trim()
  if (!intent) {
    const options = INTENT_OPTIONS.map((o) => o.value).join(', ')
    intent = (await rl.question(`Intent (${options}): `)).trim()
  }

  let styleInput = args.style?.trim()
  if (!styleInput) {
    styleInput = (
      await rl.question('Style (kennedy|ogilvy|kern|chaperon, or Enter to skip): ')
    ).trim()
  }

  rl.close()

  const validIntents = INTENT_OPTIONS.map((o) => o.value)
  if (!validIntents.includes(intent as IntentValue)) {
    console.error(
      `Invalid intent "${intent}". Choose: ${validIntents.join(', ')}`,
    )
    process.exit(1)
  }

  const style = styleInput ? resolveStyle(styleInput) : undefined

  return {
    company,
    product,
    campaign,
    intent: intent as IntentValue,
    styleKey: style?.key,
    noFile: args.noFile,
  }
}

async function checkServer(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) throw new Error('not ok')
  } catch {
    console.error('Server not running — start with npm run dev first.')
    process.exit(1)
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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

function buildContext(
  company: string,
  campaign: string,
  product: string,
): ColdContext {
  return {
    recipientName: 'there',
    recipientEmail: 'prospect@example.com',
    companyName: company,
    segmentAtSend: 'cold_prospect',
    sequenceNumber: 1,
    notes: `Campaign: ${campaign}\n\n${product}`,
  }
}

function formatOutput(
  draft: EmailDraft,
  levers: LeverSuggestion,
  styleLabel: string,
): string {
  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `SUBJECT:    ${draft.subject}`,
  ]

  if (draft.preheader?.trim()) {
    lines.push(`PREHEADER:  ${draft.preheader}`)
  }

  lines.push(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    draft.body,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'LEVERS USED:',
    `  Intent:          ${levers.intent.value}`,
    `  Framework:       ${levers.copyStrategy.values.framework}`,
    `  Emotion:         ${levers.copyStrategy.values.emotion}`,
    `  Persuasion:      ${levers.copyStrategy.values.persuasion}`,
    `  Body length:     ${levers.body.values.length}`,
    `  Personalization: ${levers.copyStrategy.values.personalizationDepth}`,
    `  Social proof:    ${levers.socialProof.values.type}`,
    `  CTA type:        ${levers.cta.values.type}`,
    `  Style:           ${styleLabel}`,
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  )

  return lines.join('\n')
}

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2))

  let company = rawArgs.company?.trim()
  let product = rawArgs.product?.trim()
  let campaign = rawArgs.campaign?.trim()
  let intent = rawArgs.intent?.trim()
  let styleResolved = rawArgs.style ? resolveStyle(rawArgs.style) : undefined

  if (!company || !product || !campaign || !intent) {
    const prompted = await promptMissing(rawArgs)
    company = prompted.company
    product = prompted.product
    campaign = prompted.campaign
    intent = prompted.intent
    styleResolved = prompted.styleKey
      ? resolveStyle(prompted.styleKey)
      : undefined
    rawArgs.noFile = prompted.noFile
  } else {
    const validIntents = INTENT_OPTIONS.map((o) => o.value)
    if (!validIntents.includes(intent as IntentValue)) {
      console.error(
        `Invalid intent "${intent}". Choose: ${validIntents.join(', ')}`,
      )
      process.exit(1)
    }
  }

  await checkServer()

  const context = buildContext(company!, campaign!, product!)

  console.error('Suggesting levers…')
  const levers = await postJson<LeverSuggestion>('/api/suggest-levers', {
    context,
    levers: cloneLeverSuggestion(),
  })

  levers.intent.value = intent as IntentValue
  levers.intent.reasoning = `Set by CLI (--intent ${intent}).`

  console.error('Generating draft…')
  const draft = await postJson<EmailDraft>('/api/generate-draft', {
    context,
    levers,
    ...(styleResolved ? { style: styleResolved.text } : {}),
  })

  const styleLabel = styleResolved?.key ?? 'none'
  const outputText = formatOutput(draft, levers, styleLabel)

  console.log(outputText)

  if (!rawArgs.noFile) {
    await mkdir(OUTPUT_DIR, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = resolve(OUTPUT_DIR, `draft-${timestamp}.txt`)
    await writeFile(filePath, outputText, 'utf8')
    console.error(`Wrote ${filePath}`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
