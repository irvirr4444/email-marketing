import type { Request, Response } from 'express'
import { openai, OPENAI_MODEL } from '../openai.js'
import {
  formatContextForPrompt,
  formatLeversForPrompt,
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
    const { context, levers } = req.body as {
      context: ColdContext
      levers: LeverSuggestion
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
    ].join('\n')

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: GENERATE_DRAFT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'email_draft',
          strict: true,
          schema: GENERATE_DRAFT_JSON_SCHEMA,
        },
      },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      res.status(500).json({ error: 'No response from AI.' })
      return
    }

    const draft = JSON.parse(content) as EmailDraft
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
