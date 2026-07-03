import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { cloneLeverSuggestion, type EmailDraft, type LeverSuggestion } from '../shared/schema.ts'
import { leverSummary } from '../shared/email-variables.ts'
import { applyScenarioToLevers, type Scenario } from './scenarios.ts'

export type BatchEmailRecord = {
  index: number
  scenario: Pick<Scenario, 'id' | 'label'>
  levers?: LeverSuggestion
  /** Precomputed lever rows (e.g. from manifest) — skips leverSummary(). */
  leverRows?: Record<string, string>
  draft: EmailDraft
  style: string
}

export { leverSummary }

function cell(text: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20 })] })],
  })
}

/** Split email body into Word paragraphs so spacing is preserved. */
export function bodyToParagraphs(body: string, size = 22): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const blocks = body.split(/\n\n+/)

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)

    if (lines.length === 1) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: lines[0]!, size })],
          spacing: { after: 160 },
        }),
      )
      continue
    }

    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line, size })],
          spacing: { after: line.startsWith('-') ? 80 : 120 },
        }),
      )
    }
  }

  return paragraphs
}

export async function exportBatchDocx(opts: {
  title: string
  company: string
  product: string
  records: BatchEmailRecord[]
  outPath: string
}): Promise<void> {
  const { title, company, product, records, outPath } = opts
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(title)],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Company: ${company} | Product: ${product}`, size: 22 })],
    }),
    new Paragraph({ text: '' }),
  ]

  for (const record of records) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Email ${record.index} — ${record.scenario.label}`)],
      }),
    )

    const summary = record.leverRows ?? leverSummary(record.levers!)
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell('Lever'), cell('Value')] }),
          ...Object.entries(summary).map(
            ([key, val]) => new TableRow({ children: [cell(key), cell(val)] }),
          ),
          new TableRow({ children: [cell('Writing style'), cell(record.style)] }),
        ],
      }),
      new Paragraph({
        children: [new TextRun({ text: 'SUBJECT:', bold: true, size: 22 })],
      }),
      new Paragraph({ children: [new TextRun({ text: record.draft.subject, size: 22 })] }),
    )

    if (record.draft.preheader?.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'PREHEADER:', bold: true, size: 22 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: record.draft.preheader, size: 20 })],
        }),
      )
    }

    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'BODY:', bold: true, size: 22 })],
      }),
      ...bodyToParagraphs(record.draft.body),
      new Paragraph({ text: '' }),
      new Paragraph({ text: '—'.repeat(40) }),
      new Paragraph({ text: '' }),
    )
  }

  const doc = new Document({ sections: [{ children }] })
  const buffer = await Packer.toBuffer(doc)
  await writeFile(outPath, buffer)
}

export function parseTxtEmail(txt: string): EmailDraft {
  const subjectMatch = txt.match(/^SUBJECT: (.+)$/m)
  const preheaderMatch = txt.match(/^PREHEADER: (.+)$/m)
  let bodyStart = 0
  if (preheaderMatch) {
    bodyStart = txt.indexOf(preheaderMatch[0]) + preheaderMatch[0].length
  } else if (subjectMatch) {
    bodyStart = txt.indexOf(subjectMatch[0]) + subjectMatch[0].length
  }
  return {
    subject: subjectMatch?.[1] ?? '',
    preheader: preheaderMatch?.[1],
    body: txt.slice(bodyStart).trim(),
  }
}

type ManifestEmail = {
  index: number
  id: string
  label: string
  style: string
  levers?: Record<string, string>
}

type ManifestScenario = {
  id: string
  label: string
  style: string
  file: string
  levers?: Record<string, string>
}

async function resolveDocxOutPath(batchDir: string): Promise<string> {
  const files = await readdir(batchDir)
  const docxFiles = files.filter((f) => f.endsWith('.docx'))
  if (docxFiles.length === 1) {
    return resolve(batchDir, docxFiles[0]!)
  }
  return resolve(batchDir, 'cold_emails.docx')
}

/** Rebuild .docx from an existing batch folder (txt files + manifest). */
export async function reexportBatchDocx(
  batchDir: string,
  scenarios?: Scenario[],
): Promise<string> {
  const manifest = JSON.parse(
    await readFile(resolve(batchDir, 'manifest.json'), 'utf8'),
  ) as {
    company: string
    product: string
    total?: number
    emails?: ManifestEmail[]
    scenarios?: ManifestScenario[]
  }

  const records: BatchEmailRecord[] = []

  if (manifest.emails?.length) {
    for (const email of manifest.emails) {
      const txtPath = resolve(
        batchDir,
        `${String(email.index).padStart(2, '0')}-${email.id}.txt`,
      )
      try {
        const txt = await readFile(txtPath, 'utf8')
        const draft = parseTxtEmail(txt)
        records.push({
          index: email.index,
          scenario: { id: email.id, label: email.label },
          leverRows: email.levers,
          draft,
          style: email.style,
        })
      } catch {
        // skip missing
      }
    }
  } else if (scenarios?.length) {
    for (let i = 0; i < scenarios.length; i++) {
      const idx = i + 1
      const scenario = scenarios[i]!
      const manifestEntry = manifest.scenarios?.find((s) => s.id === scenario.id)
      const txtPath = manifestEntry?.file
        ? resolve(batchDir, manifestEntry.file)
        : resolve(batchDir, `${String(idx).padStart(2, '0')}-${scenario.id}.txt`)
      try {
        const txt = await readFile(txtPath, 'utf8')
        const draft = parseTxtEmail(txt)
        const levers = applyScenarioToLevers(cloneLeverSuggestion(), scenario.levers)
        records.push({
          index: idx,
          scenario,
          levers,
          leverRows: manifestEntry?.levers,
          draft,
          style: scenario.style,
        })
      } catch {
        // skip missing
      }
    }
  }

  const count = manifest.total ?? records.length
  const docxPath = await resolveDocxOutPath(batchDir)
  await exportBatchDocx({
    title: `${manifest.company} — ${count} Cold Email Variations`,
    company: manifest.company,
    product: manifest.product,
    records,
    outPath: docxPath,
  })

  return docxPath
}
