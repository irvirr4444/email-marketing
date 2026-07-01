import type { Request, Response } from 'express'
import { completeStructuredJson } from '../anthropic.js'
import { RESEARCH_SOCIAL_PROOF_SYSTEM_PROMPT } from '../prompts.js'
import {
  normalizeResearchConfig,
  normalizeSocialProofAssets,
  RESEARCH_SOCIAL_PROOF_JSON_SCHEMA,
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
  productDescription: string,
  config: SocialProofResearchConfig,
): string {
  const layerList = config.layers
    .map((layer) => LAYER_LABELS[layer] ?? layer)
    .join(', ')

  return [
    '## Research scope',
    `LAYERS TO USE (only these): ${layerList}`,
    `TONE: ${config.tone}`,
    `DEPTH: ${config.depth}`,
    '',
    '## Product description',
    productDescription.trim(),
  ].join('\n')
}

export async function researchSocialProofHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { productDescription, config: rawConfig } = req.body as {
      productDescription?: string
      config?: Partial<SocialProofResearchConfig>
    }

    if (!productDescription?.trim()) {
      res.status(400).json({ error: 'Product description is required.' })
      return
    }

    const configResult = normalizeResearchConfig(rawConfig ?? {})
    if (typeof configResult === 'string') {
      res.status(400).json({ error: configResult })
      return
    }

    const config = configResult

    const raw = await completeStructuredJson({
      system: RESEARCH_SOCIAL_PROOF_SYSTEM_PROMPT,
      user: formatResearchUserPrompt(productDescription, config),
      toolName: 'social_proof_assets',
      schema: RESEARCH_SOCIAL_PROOF_JSON_SCHEMA,
    })

    const assets = normalizeSocialProofAssets(raw) as SocialProofAssets
    res.json(assets)
  } catch (err) {
    console.error('research-social-proof error:', err)
    res.status(500).json({
      error: 'Failed to research social proof. Please try again.',
    })
  }
}
