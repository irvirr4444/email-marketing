#!/usr/bin/env npx tsx
/**
 * Comprehensive URL research test matrix for Provence Beauty.
 *
 * Usage:
 *   npm run test-url-research              # fetch + 2 API comparisons
 *   npm run test-url-research -- --fetch-only
 *   npm run test-url-research -- --matrix  # all input form combinations
 */
import { fetchPageContent, formatPageExtractsForPrompt } from '../server/research/fetch-page.ts'
import { buildResearchConfig, checkServer, postJson } from './lib.ts'
import type { ResearchCliOptions } from './lib.ts'
import type { SocialProofAssets } from '../shared/schema.ts'

const COMPANY_URL = 'https://www.provencebeauty.com/'
const PRODUCT_URL =
  'https://www.provencebeauty.com/collections/serums-oils/products/dew-beaucoup-peptide-serum'

const SHORT_TEXT = 'Dew Beaucoup Peptide Plumping Serum — firming peptide serum.'
const RICH_TEXT = `Provence Beauty — Dew Beaucoup Peptide Plumping Serum.
French skincare brand. Serum with copper peptides, hyaluronic acid, ectoin, niacinamide, vitamin C.
For firming, plumping, fine lines. $22.99. Sold at Ulta.`

type Scenario = {
  name: string
  body: {
    productDescription?: string
    companyUrl?: string
    productUrl?: string
    config: ReturnType<typeof buildResearchConfig>
  }
}

function countFilled(assets: SocialProofAssets): number {
  return Object.values(assets).filter((v) => typeof v === 'string' && v.trim().length > 0).length
}

function scoreAssets(assets: SocialProofAssets): number {
  const blob = JSON.stringify(assets).toLowerCase()
  let score = countFilled(assets) * 10
  if (/55/.test(blob)) score += 15
  if (/copper peptide|hyaluronic|niacinamide|ectoin/i.test(blob)) score += 15
  if (/ulta|french|provence/i.test(blob)) score += 10
  if (/22\.99|\$22/i.test(blob)) score += 10
  if (/award/i.test(blob)) score += 5
  if (/olay|drunk elephant|millions|generic/i.test(blob)) score -= 20
  return score
}

async function runScenario(scenario: Scenario): Promise<{
  name: string
  assets: SocialProofAssets
  score: number
  filled: number
}> {
  const assets = await postJson<SocialProofAssets & { warnings?: string[] }>(
    '/api/research-social-proof',
    scenario.body,
  )
  return {
    name: scenario.name,
    assets,
    score: scoreAssets(assets),
    filled: countFilled(assets),
  }
}

async function main() {
  const fetchOnly = process.argv.includes('--fetch-only')
  const matrix = process.argv.includes('--matrix')

  console.error('Fetching pages…')
  const company = await fetchPageContent(COMPANY_URL)
  const product = await fetchPageContent(PRODUCT_URL)

  console.log('\n=== EXTRACTION QUALITY ===\n')
  console.log('Company source:', company.source ?? 'html', '| chars:', company.text.length)
  console.log('Product source:', product.source ?? 'html', '| chars:', product.text.length)
  console.log('Product price:', product.price, '| reviews:', product.rating?.count)
  console.log('Product sections:', product.sections ? Object.keys(product.sections).join(', ') : 'none')

  console.log('\n--- FORMATTED PROMPT PREVIEW (what Claude receives) ---\n')
  console.log('COMPANY:\n', formatPageExtractsForPrompt([company]).slice(0, 1200), '…\n')
  console.log('PRODUCT:\n', formatPageExtractsForPrompt([product]).slice(0, 2000), '…\n')

  const checks = [
    ['Company title', Boolean(company.title)],
    ['Product Shopify JSON', product.source === 'shopify_json'],
    ['Product price USD', product.price === '$22.99' || product.price === '$24.99'],
    ['55 reviews', product.rating?.count === '55'],
    ['Structured sections', Boolean(product.sections && Object.keys(product.sections).length > 0)],
    ['Copper peptides in extract', /copper peptide/i.test(JSON.stringify(product))],
    ['Ulta on company', /ulta/i.test(`${company.description} ${company.text}`)],
  ] as const

  console.log('--- CHECKS ---')
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`)
  }

  if (fetchOnly) return

  await checkServer()

  if (!matrix) {
    const config = buildResearchConfig({
      research: true,
      researchLayers: 'ingredient,direct,company,origin',
      researchTone: 'mass_market',
      researchDepth: 'full',
    } satisfies ResearchCliOptions)

    const textOnly = await runScenario({
      name: 'text-only (short)',
      body: { productDescription: SHORT_TEXT, config },
    })
    const urlOnly = await runScenario({
      name: 'URLs only (no text)',
      body: { companyUrl: COMPANY_URL, productUrl: PRODUCT_URL, config },
    })
    const urlPlusShort = await runScenario({
      name: 'URLs + short text',
      body: {
        productDescription: SHORT_TEXT,
        companyUrl: COMPANY_URL,
        productUrl: PRODUCT_URL,
        config,
      },
    })

    console.log('\n=== RESEARCH COMPARISON ===\n')
    for (const r of [textOnly, urlOnly, urlPlusShort]) {
      console.log(`\n[${r.name}] score=${r.score} filled=${r.filled}/5`)
      console.log(JSON.stringify(r.assets, null, 2))
    }

    const best = [textOnly, urlOnly, urlPlusShort].sort((a, b) => b.score - a.score)[0]!
    console.log(`\nBest form: ${best.name} (score ${best.score})`)
    return
  }

  const configs = [
    {
      name: 'full/mass_market',
      config: buildResearchConfig({
        research: true,
        researchLayers: 'ingredient,direct,company,origin',
        researchTone: 'mass_market',
        researchDepth: 'full',
      } satisfies ResearchCliOptions),
    },
    {
      name: 'quick/clinical',
      config: buildResearchConfig({
        research: true,
        researchLayers: 'ingredient,expert,direct',
        researchTone: 'clinical',
        researchDepth: 'quick',
      } satisfies ResearchCliOptions),
    },
    {
      name: 'fused/luxury',
      config: buildResearchConfig({
        research: true,
        researchLayers: 'origin,company,ingredient',
        researchTone: 'luxury',
        researchDepth: 'fused',
      } satisfies ResearchCliOptions),
    },
    {
      name: 'all-layers/casual',
      config: buildResearchConfig({
        research: true,
        researchLayers: 'ingredient,origin,industry,behavioral,expert,direct,company',
        researchTone: 'casual',
        researchDepth: 'full',
      } satisfies ResearchCliOptions),
    },
  ]

  const forms = [
    { name: 'text-short', productDescription: SHORT_TEXT },
    { name: 'text-rich', productDescription: RICH_TEXT },
    { name: 'product-url-only', productUrl: PRODUCT_URL },
    { name: 'company-url-only', companyUrl: COMPANY_URL },
    { name: 'both-urls', companyUrl: COMPANY_URL, productUrl: PRODUCT_URL },
    {
      name: 'both-urls+short',
      productDescription: SHORT_TEXT,
      companyUrl: COMPANY_URL,
      productUrl: PRODUCT_URL,
    },
  ]

  const results: Awaited<ReturnType<typeof runScenario>>[] = []

  console.log('\n=== FULL MATRIX (forms × configs) ===\n')

  for (const form of forms) {
    for (const cfg of configs) {
      const label = `${form.name} × ${cfg.name}`
      process.stderr.write(`Running ${label}… `)
      try {
        const r = await runScenario({
          name: label,
          body: { ...form, config: cfg.config },
        })
        results.push(r)
        console.error(`score=${r.score}`)
      } catch (err) {
        console.error('FAIL', err instanceof Error ? err.message : err)
      }
    }
  }

  results.sort((a, b) => b.score - a.score)

  console.log('\n--- RANKED RESULTS ---\n')
  for (const r of results) {
    console.log(`${r.score}\t${r.filled}/5\t${r.name}`)
  }

  console.log('\n--- TOP 3 DETAIL ---\n')
  for (const r of results.slice(0, 3)) {
    console.log(`\n## ${r.name} (score ${r.score})\n`)
    console.log(JSON.stringify(r.assets, null, 2))
  }

  console.log('\n--- WHY CLAUDE CHAT FEELS BETTER ---')
  console.log(`
1. Claude chat can browse the live page (or you paste the full page) — no 10k char cap, no carousel noise.
2. Chat is NOT forced into 5 JSON fields — it writes a free-form dossier.
3. Our pipeline NOW uses Shopify product JSON ($22.99, clean description) + HTML accordions for ingredients/benefits.
4. Best input form here: "${results[0]?.name}" — use both URLs, layers ingredient+direct+company+origin, depth full.
5. Text-only still invents category proof (Olay, "millions") — URLs ground it in real page facts.
`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
