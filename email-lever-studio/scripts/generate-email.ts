#!/usr/bin/env npx tsx
import { mkdir, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { resolve } from 'node:path'
import {
  cloneLeverSuggestion,
  INTENT_OPTIONS,
  type EmailDraft,
  type IntentValue,
  type LeverSuggestion,
} from '../shared/schema.ts'
import { resolveStyleFromFlag, WRITING_STYLES, type StyleKey } from './writing-styles.ts'
import {
  buildContext,
  checkServer,
  CLI_FLAG_ALIASES,
  formatOutput,
  OUTPUT_DIR,
  postJson,
  resolveSocialProofAssets,
  type ResearchCliOptions,
} from './lib.ts'

type CliArgs = ResearchCliOptions & {
  company?: string
  product?: string
  campaign?: string
  intent?: string
  style?: string
  noFile: boolean
}

const FLAG_ALIASES = CLI_FLAG_ALIASES as Record<string, keyof ResearchCliOptions | keyof CliArgs>

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { noFile: false, research: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--no-file') {
      args.noFile = true
      continue
    }
    if (arg === '--research') {
      args.research = true
      continue
    }
    if (arg.startsWith('--')) {
      const rawKey = arg.slice(2)
      const key = (FLAG_ALIASES[rawKey] ?? rawKey) as keyof CliArgs
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
  research: boolean
  researchLayers?: string
  researchTone?: string
  researchDepth?: string
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
      await rl.question(`Style (${Object.keys(WRITING_STYLES).join('|')}, or Enter to skip): `)
    ).trim()
  }

  let research = args.research
  if (!research && !args.socialProofResult && !args.socialProofCustomer) {
    const researchAnswer = (
      await rl.question('Research social proof? (y/N): ')
    ).trim()
    research = researchAnswer.toLowerCase() === 'y'
  }

  let researchLayers = args.researchLayers
  let researchTone = args.researchTone
  let researchDepth = args.researchDepth
  if (research) {
    if (!researchLayers) {
      researchLayers = (
        await rl.question(
          'Research layers (ingredient,origin,industry,behavioral,expert,direct,company): ',
        )
      ).trim()
    }
    if (!researchTone) {
      researchTone = (
        await rl.question('Research tone (clinical|mass_market|luxury|casual): ')
      ).trim()
    }
    if (!researchDepth) {
      researchDepth = (
        await rl.question('Research depth (quick|full|fused): ')
      ).trim()
    }
  }

  rl.close()

  const validIntents = INTENT_OPTIONS.map((o) => o.value)
  if (!validIntents.includes(intent as IntentValue)) {
    console.error(
      `Invalid intent "${intent}". Choose: ${validIntents.join(', ')}`,
    )
    process.exit(1)
  }

  const style = styleInput ? resolveStyleFromFlag(styleInput) : undefined

  return {
    company,
    product,
    campaign,
    intent: intent as IntentValue,
    styleKey: style?.key,
    noFile: args.noFile,
    research,
    researchLayers,
    researchTone,
    researchDepth,
  }
}

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2))

  let company = rawArgs.company?.trim()
  let product = rawArgs.product?.trim()
  let campaign = rawArgs.campaign?.trim()
  let intent = rawArgs.intent?.trim()
  let styleResolved = rawArgs.style ? resolveStyleFromFlag(rawArgs.style) : undefined
  let researchOpts: ResearchCliOptions = {
    research: rawArgs.research,
    researchLayers: rawArgs.researchLayers,
    researchTone: rawArgs.researchTone,
    researchDepth: rawArgs.researchDepth,
    companyUrl: rawArgs.companyUrl,
    productUrl: rawArgs.productUrl,
    socialProofResult: rawArgs.socialProofResult,
    socialProofCustomer: rawArgs.socialProofCustomer,
    socialProofQuote: rawArgs.socialProofQuote,
    socialProofCount: rawArgs.socialProofCount,
    socialProofWin: rawArgs.socialProofWin,
  }

  if (!company || !product || !campaign || !intent) {
    const prompted = await promptMissing(rawArgs)
    company = prompted.company
    product = prompted.product
    campaign = prompted.campaign
    intent = prompted.intent
    styleResolved = prompted.styleKey
      ? resolveStyleFromFlag(prompted.styleKey)
      : undefined
    rawArgs.noFile = prompted.noFile
    researchOpts = {
      ...researchOpts,
      research: prompted.research,
      researchLayers: prompted.researchLayers,
      researchTone: prompted.researchTone,
      researchDepth: prompted.researchDepth,
    }
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

  const socialProofAssets = await resolveSocialProofAssets(product!, researchOpts)
  const context = buildContext(company!, campaign!, product!, socialProofAssets)

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
