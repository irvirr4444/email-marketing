import type { Request, Response } from 'express'
import { completeStructuredJson } from '../anthropic.js'
import { formatContextForPrompt, validateColdContext } from '../levers.js'
import { GENERATE_DRAFT_SYSTEM_PROMPT } from '../prompts.js'
import { buildLeverInstructions } from '../../shared/lever-definitions.ts'
import {
  GENERATE_DRAFT_JSON_SCHEMA,
  applySocialProofFromAssets,
  type ColdContext,
  type EmailDraft,
  type LeverSuggestion,
} from '../../shared/schema.ts'
import { applyGenerationDefaults } from '../../shared/generation-defaults.ts'

export async function generateDraftHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { context, levers, style, leverSource } = req.body as {
      context: ColdContext
      levers: LeverSuggestion
      style?: string
      leverSource?: 'bandit' | 'claude'
    }

    const validationError = validateColdContext(context)
    if (validationError) {
      res.status(400).json({ error: validationError })
      return
    }

    if (!levers) {
      res.status(400).json({ error: 'Lever settings are required.' })
      return
    }

    // Bandit-picked levers are already reconciled client-side and must not be
    // mutated here ('none' persuasion / social proof are legitimate policy choices).
    const isBandit = leverSource === 'bandit'
    if (!isBandit) {
      applySocialProofFromAssets(levers, context.socialProofAssets)
    }
    const defaults = applyGenerationDefaults(levers, context.socialProofAssets, {
      applyPersuasionDefault: !isBandit,
    })

    const userPrompt = [
      '## Context',
      formatContextForPrompt(context),
      '',
      buildLeverInstructions(levers, context),
    ].join('\n')

    const system = style
      ? `${GENERATE_DRAFT_SYSTEM_PROMPT}\n\n${style}`
      : `${GENERATE_DRAFT_SYSTEM_PROMPT}\n\n${defaults.styleText}`

    const draft = (await completeStructuredJson({
      system,
      user: userPrompt,
      toolName: 'email_draft',
      schema: GENERATE_DRAFT_JSON_SCHEMA,
    })) as EmailDraft

    if (!draft.preheader?.trim()) {
      delete draft.preheader
    }
    res.json(draft)
  } catch (err) {
    console.error('generate-draft error:', err)
    res.status(500).json({
      error: 'Failed to generate draft. Please try again.',
    })
  }
}
