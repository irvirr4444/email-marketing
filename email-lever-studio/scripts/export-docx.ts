import { readFile, writeFile } from 'node:fs/promises'
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
import { cloneLeverSuggestion, type EmailDraft, type LeverSuggestion, type SocialProofAssets } from '../shared/schema.ts'
import { applyScenarioToLevers, type Scenario } from './scenarios.ts'

export type BatchEmailRecord = {
  index: number
  scenario: Scenario
  levers: LeverSuggestion
  draft: EmailDraft
  style: string
}

export function leverSummary(levers: LeverSuggestion): Record<string, string> {
  const sl = levers.subjectLine.values
  const ph = levers.preheader.values
  const bd = levers.body.values
  const cs = levers.copyStrategy.values
  const sp = levers.socialProof.values
  const ct = levers.cta.values
  const of = levers.offer.values

  return {
    Intent: levers.intent.value,
    Framework: cs.framework,
    Emotion: cs.emotion,
    Persuasion: cs.persuasion,
    Specificity: cs.specificity,
    Personalization: cs.personalizationDepth,
    'Subject type': sl.type,
    'Subject length': sl.length,
    'Subject casing': sl.casing,
    Preheader: ph.present ? `${ph.length}, ${ph.relationship}` : 'omit',
    'Body length': bd.length,
    'Body links': bd.linkCount,
    Scannable: String(bd.scannable),
    'Social proof': sp.type,
    'SP placement': sp.type === 'none' ? '—' : sp.placement,
    'SP specificity': sp.type === 'none' ? '—' : sp.specificity,
    'CTA type': ct.type,
    'CTA style': ct.style,
    'CTA placement': ct.placement,
    'CTA copy': levers.cta.ctaCopy,
    Offer: of.hasOffer ? `${of.type} ${of.magnitude}` : 'none',
  }
}

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
  assets?: SocialProofAssets
  outPath: string
}): Promise<void> {
  const { title, company, product, records, assets, outPath } = opts
  const children: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(title)],
    }),
    new Paragraph({
      children: [new TextRun({ text: `Company: ${company} | Product: ${product}`, size: 22 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toISOString().split('T')[0]} | ${records.length} cold email variation(s)`,
          size: 20,
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ]

  if (assets && Object.keys(assets).length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun('Social Proof Assets Used')],
      }),
      ...Object.entries(assets).map(
        ([k, v]) =>
          new Paragraph({
            children: [new TextRun({ text: `${k}: ${v ?? '—'}`, size: 20 })],
          }),
      ),
      new Paragraph({ text: '' }),
    )
  }

  for (const record of records) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Email ${record.index} — ${record.scenario.label}`)],
      }),
    )

    const summary = leverSummary(record.levers)
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

/** Rebuild .docx from an existing batch folder (txt files + manifest). */
export async function reexportBatchDocx(
  batchDir: string,
  scenarios: Scenario[],
): Promise<string> {
  const manifest = JSON.parse(
    await readFile(resolve(batchDir, 'manifest.json'), 'utf8'),
  ) as {
    company: string
    product: string
    socialProofAssets?: SocialProofAssets
  }

  const records: BatchEmailRecord[] = []

  for (let i = 0; i < scenarios.length; i++) {
    const idx = i + 1
    const scenario = scenarios[i]!
    const txtPath = resolve(
      batchDir,
      `${String(idx).padStart(2, '0')}-${scenario.id}.txt`,
    )
    try {
      const txt = await readFile(txtPath, 'utf8')
      const draft = parseTxtEmail(txt)
      const levers = applyScenarioToLevers(cloneLeverSuggestion(), scenario.levers)
      records.push({
        index: idx,
        scenario,
        levers,
        draft,
        style: scenario.style,
      })
    } catch {
      // skip missing
    }
  }

  const docxPath = resolve(batchDir, 'cold_emails.docx')
  await exportBatchDocx({
    title: `${manifest.company} — Cold Email Variations`,
    company: manifest.company,
    product: manifest.product,
    records,
    assets: manifest.socialProofAssets,
    outPath: docxPath,
  })

  return docxPath
}
