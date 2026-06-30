import type { Request, Response } from 'express'
import { openai, OPENAI_MODEL } from '../openai.js'
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

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SUGGEST_LEVERS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: formatContextForPrompt(context),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'lever_suggestions',
          strict: true,
          schema: SUGGEST_LEVERS_JSON_SCHEMA,
        },
      },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      res.status(500).json({ error: 'No response from AI.' })
      return
    }

    const parsed = JSON.parse(content)
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
