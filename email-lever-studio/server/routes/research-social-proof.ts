import type { Request, Response } from 'express'
import { completeStructuredJson } from '../anthropic.js'
import { RESEARCH_SOCIAL_PROOF_SYSTEM_PROMPT } from '../prompts.js'
import { fetchPageContentCached } from '../research/page-cache.ts'
import { formatPageExtractsForPrompt } from '../research/fetch-page.ts'
import {
  normalizeResearchConfig,
  normalizeSocialProofAssets,
  RESEARCH_SOCIAL_PROOF_JSON_SCHEMA,
  type PageExtract,
  type SocialProofAssets,
  type SocialProofResearchConfig,
} from '../../shared/schema.ts'

const LAYER_LABELS: Record<string, string> = {
  ingredient: 'Ingredient / Material / Technology',
  origin: 'Origin / Geography',
  industry: 'Industry / Market',
  behavioral: 'Behavioral / Social',
  expert: 'Expert / Authority',
  direct: 'Direct Product',
  company: 'Company / Brand',
}

function formatResearchUserPrompt(
  productDescription: string | undefined,
  config: SocialProofResearchConfig,
  companyPage?: PageExtract,
  productPage?: PageExtract,
): string {
  const layerList = config.layers
    .map((layer) => LAYER_LABELS[layer] ?? layer)
    .join(', ')

  const sections = [
    '## Research scope',
    `LAYERS TO USE (only these): ${layerList}`,
    `TONE: ${config.tone}`,
    `DEPTH: ${config.depth}`,
  ]

  if (companyPage) {
    sections.push('', '## Company page (from URL)', formatPageExtractsForPrompt([companyPage]))
  }

  if (productPage) {
    sections.push('', '## Product page (from URL)', formatPageExtractsForPrompt([productPage]))
  }

  if (productDescription?.trim()) {
    sections.push('', '## Product description (sender provided)', productDescription.trim())
  }

  return sections.join('\n')
}

export async function researchSocialProofHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { productDescription, companyUrl, productUrl, config: rawConfig } = req.body as {
      productDescription?: string
      companyUrl?: string
      productUrl?: string
      config?: Partial<SocialProofResearchConfig>
    }

    const hasDescription = Boolean(productDescription?.trim())
    const hasCompanyUrl = Boolean(companyUrl?.trim())
    const hasProductUrl = Boolean(productUrl?.trim())

    if (!hasDescription && !hasCompanyUrl && !hasProductUrl) {
      res.status(400).json({
        error: 'At least one of productDescription, companyUrl, or productUrl is required.',
      })
      return
    }

    const configResult = normalizeResearchConfig(rawConfig ?? {})
    if (typeof configResult === 'string') {
      res.status(400).json({ error: configResult })
      return
    }

    const config = configResult
    const warnings: string[] = []
    let companyPage: PageExtract | undefined
    let productPage: PageExtract | undefined

    if (hasCompanyUrl) {
      companyPage = await fetchPageContentCached(companyUrl!.trim())
      if (companyPage.error) warnings.push(`Company URL: ${companyPage.error}`)
    }

    if (hasProductUrl) {
      productPage = await fetchPageContentCached(productUrl!.trim())
      if (productPage.error) warnings.push(`Product URL: ${productPage.error}`)
    }

    const raw = await completeStructuredJson({
      system: RESEARCH_SOCIAL_PROOF_SYSTEM_PROMPT,
      user: formatResearchUserPrompt(productDescription, config, companyPage, productPage),
      toolName: 'social_proof_assets',
      schema: RESEARCH_SOCIAL_PROOF_JSON_SCHEMA,
    })

    const assets = normalizeSocialProofAssets(raw) as SocialProofAssets

    if (warnings.length > 0) {
      res.json({ ...assets, warnings })
      return
    }

    res.json(assets)
  } catch (err) {
    console.error('research-social-proof error:', err)
    res.status(500).json({
      error: 'Failed to research social proof. Please try again.',
    })
  }
}
