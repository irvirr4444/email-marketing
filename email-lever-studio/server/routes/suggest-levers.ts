import type { Request, Response } from 'express'
import { completeStructuredJson } from '../anthropic.js'
import {
  formatContextForPrompt,
  validateColdContext,
} from '../levers.js'
import { SUGGEST_LEVERS_SYSTEM_PROMPT } from '../prompts.js'
import {
  normalizeLeverSuggestion,
  mergeWithLocked,
  SUGGEST_LEVERS_JSON_SCHEMA,
  type ColdContext,
  type LeverSuggestion,
} from '../../shared/schema.ts'

export async function suggestLeversHandler(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { context, levers: existingLevers } = req.body as {
      context: ColdContext
      levers?: LeverSuggestion
    }
    const validationError = validateColdContext(context)
    if (validationError) {
      res.status(400).json({ error: validationError })
      return
    }

    const parsed = await completeStructuredJson({
      system: SUGGEST_LEVERS_SYSTEM_PROMPT,
      user: formatContextForPrompt(context),
      toolName: 'lever_suggestions',
      schema: SUGGEST_LEVERS_JSON_SCHEMA,
    })

    const levers = mergeWithLocked(
      normalizeLeverSuggestion(parsed),
      existingLevers,
    )
    res.json(levers)
  } catch (err) {
    console.error('suggest-levers error:', err)
    res.status(500).json({
      error: 'Failed to suggest levers. Please try again.',
    })
  }
}
