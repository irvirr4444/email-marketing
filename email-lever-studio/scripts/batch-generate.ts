#!/usr/bin/env npx tsx
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  cloneLeverSuggestion,
  type EmailDraft,
  type IntentValue,
  type LeverSuggestion,
} from '../shared/schema.ts'
import {
  buildContext,
  buildResearchConfig,
  checkServer,
  CLI_FLAG_ALIASES,
  formatOutput,
  OUTPUT_DIR,
  postJson,
  resolveSocialProofAssets,
  sleep,
  type ResearchCliOptions,
} from './lib.ts'
import {
  applyScenarioToLevers,
  buildDiverse50Scenarios,
  listScenarios,
  resolveStyleText,
  type Scenario,
} from './scenarios.ts'
import {
  exportBatchDocx,
  leverSummary,
  reexportBatchDocx,
  type BatchEmailRecord,
} from './export-docx.ts'

type CliArgs = ResearchCliOptions & {
  company?: string
  product?: string
  campaign?: string
  intent?: string
  matrix: boolean
  diverse50: boolean
  docx: boolean
  limit?: number
  delay: number
  listOnly: boolean
  reexportDocx?: string
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    matrix: false,
    diverse50: false,
    docx: false,
    delay: 500,
    listOnly: false,
    research: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--matrix') {
      args.matrix = true
      continue
    }
    if (arg === '--diverse50') {
      args.diverse50 = true
      continue
    }
    if (arg === '--docx') {
      args.docx = true
      continue
    }
    if (arg === '--list') {
      args.listOnly = true
      continue
    }
    if (arg === '--research') {
      args.research = true
      continue
    }
    if (arg === '--reexport-docx') {
      args.reexportDocx = argv[++i]
      continue
    }
    if (arg.startsWith('--')) {
      const rawKey = arg.slice(2)
      const key = (CLI_FLAG_ALIASES[rawKey] ?? rawKey) as keyof CliArgs
      const value = argv[++i]
      if (value && !value.startsWith('--')) {
        if (key === 'limit') args.limit = Number(value)
        else if (key === 'delay') args.delay = Number(value)
        else (args as Record<string, string | number | boolean>)[key] = value
      }
    }
  }

  return args
}

function usage(): void {
  console.log(`Usage: npm run batch -- [options]

Required (except --list / --reexport-docx):
  --company   Sender company name
  --product   Product description
  --campaign  Campaign label

Scenario sets (pick one):
  (default)   12 curated scenarios
  --matrix    4 frameworks × 4 emotions × 5 styles = 80 combos
  --diverse50 50 scenarios with broad lever coverage

Options:
  --intent    Default intent when scenario does not override (default: get_reply)
  --limit N   Max scenarios to run
  --delay MS  Pause between API calls (default: 500)
  --list      Print scenario IDs and exit
  --docx      Also write cold_emails.docx with lever tables (paragraph spacing preserved)
  --reexport-docx <batch-dir>  Rebuild cold_emails.docx from existing batch folder
  --research  Run social proof research once (reused across scenarios)
  --research-layers / --research-tone / --research-depth
  --social-proof-*  Direct proof assets (merged with research)

Examples:
  npm run batch -- --company "Acme" --product "Invoice SaaS" --campaign "Q3"
  npm run batch -- --company "Acme" --product "..." --campaign "..." --diverse50 --docx --research
  npm run batch -- --reexport-docx output/batch-2026-01-01T12-00-00-000Z
`)
}

type ManifestEntry = {
  id: string
  label: string
  style: string
  file: string
  intent: string
  framework: string
  emotion: string
  persuasion: string
  subject: string
  levers?: Record<string, string>
  error?: string
}

async function generateOne(
  context: ReturnType<typeof buildContext>,
  scenario: Scenario,
  defaultIntent: IntentValue,
): Promise<{ levers: LeverSuggestion; draft: EmailDraft }> {
  let levers = applyScenarioToLevers(cloneLeverSuggestion(), scenario.levers)
  if (!scenario.levers.intent) {
    levers.intent.value = defaultIntent
    levers.intent.reasoning = `Batch default intent: ${defaultIntent}.`
  }

  const styleText = resolveStyleText(scenario.style)
  const draft = await postJson<EmailDraft>('/api/generate-draft', {
    context,
    levers,
    ...(styleText ? { style: styleText } : {}),
  })

  return { levers, draft }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage()
    process.exit(0)
  }

  if (args.reexportDocx) {
    const scenarios = args.diverse50
      ? buildDiverse50Scenarios()
      : listScenarios({ matrix: args.matrix, diverse50: false, limit: args.limit })
    const docxPath = await reexportBatchDocx(args.reexportDocx, scenarios)
    console.error(`Docx rebuilt: ${docxPath}`)
    console.log(docxPath)
    return
  }

  const scenarios = listScenarios({
    matrix: args.matrix,
    diverse50: args.diverse50,
    limit: args.limit,
  })

  if (args.listOnly) {
    for (const s of scenarios) {
      console.log(`${s.id}\t${s.label}\tstyle=${s.style}`)
    }
    console.error(`\n${scenarios.length} scenario(s)`)
    return
  }

  if (!args.company || !args.product || !args.campaign) {
    usage()
    process.exit(1)
  }

  const defaultIntent = (args.intent ?? 'get_reply') as IntentValue
  await checkServer()

  const researchOpts: ResearchCliOptions = {
    research: args.research,
    researchLayers: args.researchLayers,
    researchTone: args.researchTone,
    researchDepth: args.researchDepth,
    socialProofResult: args.socialProofResult,
    socialProofCustomer: args.socialProofCustomer,
    socialProofQuote: args.socialProofQuote,
    socialProofCount: args.socialProofCount,
    socialProofWin: args.socialProofWin,
  }

  const socialProofAssets = await resolveSocialProofAssets(args.product!, researchOpts)
  const context = buildContext(
    args.company!,
    args.campaign!,
    args.product!,
    socialProofAssets,
  )
  const batchId = new Date().toISOString().replace(/[:.]/g, '-')
  const batchDir = resolve(OUTPUT_DIR, `batch-${batchId}`)
  await mkdir(batchDir, { recursive: true })

  const docxRecords: BatchEmailRecord[] = []

  const manifest: {
    batchId: string
    createdAt: string
    company: string
    campaign: string
    product: string
    defaultIntent: string
    mode: string
    research?: ReturnType<typeof buildResearchConfig>
    socialProofAssets?: typeof socialProofAssets
    scenarios: ManifestEntry[]
  } = {
    batchId,
    createdAt: new Date().toISOString(),
    company: args.company!,
    campaign: args.campaign!,
    product: args.product!,
    defaultIntent,
    mode: args.diverse50 ? 'diverse50' : args.matrix ? 'matrix' : 'curated',
    ...(args.research ? { research: buildResearchConfig(researchOpts) } : {}),
    ...(socialProofAssets ? { socialProofAssets } : {}),
    scenarios: [],
  }

  console.error(`Running ${scenarios.length} scenario(s) → ${batchDir}\n`)

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i]!
    const num = String(i + 1).padStart(args.diverse50 ? 2 : 3, '0')
    const fileName = `${num}-${scenario.id}.txt`
    const filePath = resolve(batchDir, fileName)

    process.stderr.write(`[${i + 1}/${scenarios.length}] ${scenario.id}… `)

    try {
      const { levers, draft } = await generateOne(context, scenario, defaultIntent)
      const styleLabel = scenario.style
      const text = formatOutput(draft, levers, styleLabel, scenario.label)
      await writeFile(filePath, text, 'utf8')

      if (args.docx) {
        docxRecords.push({
          index: i + 1,
          scenario,
          levers,
          draft,
          style: styleLabel,
        })
      }

      manifest.scenarios.push({
        id: scenario.id,
        label: scenario.label,
        style: styleLabel,
        file: fileName,
        intent: levers.intent.value,
        framework: levers.copyStrategy.values.framework,
        emotion: levers.copyStrategy.values.emotion,
        persuasion: levers.copyStrategy.values.persuasion,
        subject: draft.subject,
        ...(args.docx ? { levers: leverSummary(levers) } : {}),
      })

      console.error('ok')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`FAIL: ${message}`)
      manifest.scenarios.push({
        id: scenario.id,
        label: scenario.label,
        style: scenario.style,
        file: fileName,
        intent: scenario.levers.intent ?? defaultIntent,
        framework: scenario.levers.copyStrategy?.framework ?? '?',
        emotion: scenario.levers.copyStrategy?.emotion ?? '?',
        persuasion: scenario.levers.copyStrategy?.persuasion ?? '?',
        subject: '',
        error: message,
      })
    }

    if (i < scenarios.length - 1 && args.delay > 0) {
      await sleep(args.delay)
    }
  }

  const manifestPath = resolve(batchDir, 'manifest.json')
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  if (args.docx && docxRecords.length > 0) {
    const docxPath = resolve(batchDir, 'cold_emails.docx')
    await exportBatchDocx({
      title: `${args.company} — Cold Email Variations`,
      company: args.company!,
      product: args.product!,
      records: docxRecords,
      assets: socialProofAssets,
      outPath: docxPath,
    })
    console.error(`Docx: ${docxPath}`)
  }

  const ok = manifest.scenarios.filter((s) => !s.error).length
  const failed = manifest.scenarios.length - ok

  console.error(`\nDone: ${ok} succeeded, ${failed} failed`)
  console.error(`Manifest: ${manifestPath}`)
  console.log(batchDir)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
