#!/usr/bin/env npx tsx
/**
 * Generate Postgres import SQL from a batch folder.
 * Run the output in Supabase SQL Editor after applying 003_generated_emails.sql
 *
 * Usage:
 *   npm run import-batch -- output/provence-50-2026-07-01T14-26-07-634Z
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type ManifestEmail = {
  index: number
  id: string
  label: string
  style: string
  subject: string
  levers: Record<string, string>
}

type Manifest = {
  batchId: string
  company: string
  product: string
  campaign?: string
  total: number
  socialProofAssets?: Record<string, string>
  emails: ManifestEmail[]
}

function pgStr(value: string | null | undefined): string {
  if (value == null || value === '') return 'NULL'
  return `'${value.replace(/'/g, "''")}'`
}

function pgBool(value: boolean | null | undefined): string {
  if (value == null) return 'NULL'
  return value ? 'true' : 'false'
}

function parsePreheader(value: string): { present: boolean; length?: string; relationship?: string } {
  if (value === 'omit' || !value) return { present: false }
  const parts = value.split(', ')
  return { present: true, length: parts[0], relationship: parts[1] }
}

function parseOffer(value: string): { hasOffer: boolean; type?: string; magnitude?: string } {
  if (value === 'none' || !value) return { hasOffer: false }
  const match = value.match(/^(\S+)\s+(.+)$/)
  if (match) return { hasOffer: true, type: match[1], magnitude: match[2] }
  return { hasOffer: true, type: value }
}

async function readEmailBody(batchDir: string, email: ManifestEmail): Promise<string> {
  const txtPath = resolve(batchDir, `${String(email.index).padStart(2, '0')}-${email.id}.txt`)
  const txt = await readFile(txtPath, 'utf8')
  const subjectMatch = txt.match(/^SUBJECT: .+$/m)
  if (subjectMatch) {
    const bodyStart = txt.indexOf(subjectMatch[0]) + subjectMatch[0].length
    return txt.slice(bodyStart).trim()
  }
  return txt
}

async function main() {
  const batchDir = process.argv[2]
  if (!batchDir) {
    console.error('Usage: npm run import-batch -- <batch-dir>')
    process.exit(1)
  }

  const absBatchDir = resolve(batchDir)
  const manifest: Manifest = JSON.parse(
    await readFile(resolve(absBatchDir, 'manifest.json'), 'utf8'),
  )

  const lines: string[] = [
    '-- Postgres import for generation_batch + generated_email',
    `-- Batch: ${manifest.batchId}`,
    '',
    `INSERT INTO generation_batch (batch_id, company, product, campaign, social_proof_assets, total_generated)`,
    `VALUES (`,
    `  ${pgStr(manifest.batchId)},`,
    `  ${pgStr(manifest.company)},`,
    `  ${pgStr(manifest.product)},`,
    `  ${pgStr(manifest.campaign ?? null)},`,
    `  ${pgStr(JSON.stringify(manifest.socialProofAssets ?? {}))}::jsonb,`,
    `  ${manifest.total}`,
    `)`,
    `ON CONFLICT (batch_id) DO UPDATE SET`,
    `  company = EXCLUDED.company,`,
    `  product = EXCLUDED.product,`,
    `  campaign = EXCLUDED.campaign,`,
    `  social_proof_assets = EXCLUDED.social_proof_assets,`,
    `  total_generated = EXCLUDED.total_generated;`,
    '',
  ]

  for (const email of manifest.emails) {
    const body = await readEmailBody(absBatchDir, email)
    const l = email.levers
    const ph = parsePreheader(l['Preheader'] ?? '')
    const offer = parseOffer(l['Offer'] ?? 'none')

    lines.push(
      `INSERT INTO generated_email (`,
      `  batch_id, scenario_id, scenario_label, index_in_batch, subject, body,`,
      `  intent, subject_type, subject_length, subject_casing,`,
      `  preheader_present, preheader_length, preheader_relationship,`,
      `  body_length, body_links, body_scannable,`,
      `  framework, emotion, persuasion, specificity, personalization_depth, writing_style,`,
      `  social_proof_type, social_proof_placement, social_proof_specificity,`,
      `  cta_type, cta_style, cta_placement, cta_copy,`,
      `  has_offer, offer_type, offer_magnitude`,
      `)`,
      `SELECT`,
      `  (SELECT id FROM generation_batch WHERE batch_id = ${pgStr(manifest.batchId)}),`,
      `  ${pgStr(email.id)},`,
      `  ${pgStr(email.label)},`,
      `  ${email.index},`,
      `  ${pgStr(email.subject)},`,
      `  ${pgStr(body)},`,
      `  ${pgStr(l['Intent'])},`,
      `  ${pgStr(l['Subject type'])},`,
      `  ${pgStr(l['Subject length'])},`,
      `  ${pgStr(l['Subject casing'])},`,
      `  ${pgBool(ph.present)},`,
      `  ${pgStr(ph.length ?? null)},`,
      `  ${pgStr(ph.relationship ?? null)},`,
      `  ${pgStr(l['Body length'])},`,
      `  ${pgStr(l['Body links'])},`,
      `  ${pgBool(l['Scannable'] === 'true')},`,
      `  ${pgStr(l['Framework'] === 'none' ? null : l['Framework'])},`,
      `  ${pgStr(l['Emotion'])},`,
      `  ${pgStr(l['Persuasion'] === 'none' ? null : l['Persuasion'])},`,
      `  ${pgStr(l['Specificity'])},`,
      `  ${pgStr(l['Personalization'])},`,
      `  ${pgStr(email.style === 'none' ? null : email.style)},`,
      `  ${pgStr(l['Social proof'] === 'none' ? null : l['Social proof'])},`,
      `  ${pgStr(l['SP placement'] === '—' ? null : l['SP placement'])},`,
      `  ${pgStr(l['SP specificity'] === '—' ? null : l['SP specificity'])},`,
      `  ${pgStr(l['CTA type'])},`,
      `  ${pgStr(l['CTA style'])},`,
      `  ${pgStr(l['CTA placement'])},`,
      `  ${pgStr(l['CTA copy'])},`,
      `  ${pgBool(offer.hasOffer)},`,
      `  ${pgStr(offer.type ?? null)},`,
      `  ${pgStr(offer.magnitude ?? null)}`,
      `ON CONFLICT (batch_id, scenario_id) DO UPDATE SET`,
      `  scenario_label = EXCLUDED.scenario_label,`,
      `  subject = EXCLUDED.subject,`,
      `  body = EXCLUDED.body,`,
      `  intent = EXCLUDED.intent,`,
      `  framework = EXCLUDED.framework,`,
      `  emotion = EXCLUDED.emotion,`,
      `  writing_style = EXCLUDED.writing_style,`,
      `  cta_type = EXCLUDED.cta_type,`,
      `  cta_copy = EXCLUDED.cta_copy;`,
      '',
    )
  }

  lines.push(
    `SELECT COUNT(*) AS imported FROM generated_email`,
    `WHERE batch_id = (SELECT id FROM generation_batch WHERE batch_id = ${pgStr(manifest.batchId)});`,
  )

  const outPath = resolve(absBatchDir, 'import-postgres.sql')
  await writeFile(outPath, lines.join('\n'), 'utf8')
  console.log(`Wrote ${manifest.emails.length} email(s) → ${outPath}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
