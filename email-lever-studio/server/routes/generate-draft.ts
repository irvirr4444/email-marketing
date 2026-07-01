import type { Request, Response } from 'express'
import { completeStructuredJson } from '../anthropic.js'
import {
  formatContextForPrompt,
  formatLeversForPrompt,
  formatSocialProofInstructions,
  validateColdContext,
} from '../levers.js'
import { GENERATE_DRAFT_SYSTEM_PROMPT } from '../prompts.js'
import {
  GENERATE_DRAFT_JSON_SCHEMA,
  type ColdContext,
  type EmailDraft,
  type LeverSuggestion,
} from '../../shared/schema.ts'

export async function generateDraftHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { context, levers, style } = req.body as {
      context: ColdContext
      levers: LeverSuggestion
      style?: string
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

    const userPrompt = [
      '## Context',
      formatContextForPrompt(context),
      '',
      '## Lever settings',
      formatLeversForPrompt(levers),
      '',
      '## Social proof instructions',
      formatSocialProofInstructions(context, levers),
    ].join('\n')

    const system = style
      ? `${GENERATE_DRAFT_SYSTEM_PROMPT}\n\n${style}`
      : GENERATE_DRAFT_SYSTEM_PROMPT

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
