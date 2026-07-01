export const WRITING_STYLES = {
  kennedy: `## Writing Style — Dan Kennedy (Direct Response)

Write with blunt, no-BS authority. Structure the body as Problem → Agitate → Solution.
The headline must be bold and benefit-driven — no puns, no wordplay.
Tie the CTA to the reader's identity: not buying means staying in a lesser group.
Every sentence must earn its place. Create urgency. Make the cost of inaction viscerally real before introducing any offer.`,

  ogilvy: `## Writing Style — David Ogilvy (Research-Driven Persuasion)

You are not writing to be admired. You are writing to sell.
The subject line must promise a specific, tangible benefit and telegraph the message immediately.
Write with the elegance of a highly intelligent adult speaking to another intelligent adult — never folksy, never corporate.
Lead with the most compelling specific fact about the product. Specificity is more credible than vagueness.
Use short words, short sentences, short paragraphs. Make the product the hero.`,

  kern: `## Writing Style — Frank Kern (Conversational Closer)

Write like you're talking to a friend who has the exact problem this product solves.
Use contractions. Use short sentences. Use pauses. Keep it raw and real — never polished.
Open with a personal story or relatable situation before introducing the offer.
Sell the outcome, not the process. Lead with the transformation, never the features.
The reader should feel this was written by one human for one human.`,

  chaperon: `## Writing Style — Andre Chaperon (Soap Opera / Story-Driven)

You are not sending a marketing email. You are writing an episode.
Open a story loop — a moment of tension or curiosity — and do not fully close it.
Be personal, confessional, and specific. The tone is lived-in, not polished.
Deliver genuine value inside the email before any ask.
End with exactly one CTA. Leave them wanting to know what happens next.`,
} as const

export type StyleKey = keyof typeof WRITING_STYLES

export function resolveStyle(
  flag: string | undefined,
): { key: StyleKey; text: string } | undefined {
  if (!flag) return undefined

  const key = flag.toLowerCase() as StyleKey
  if (!(key in WRITING_STYLES)) {
    console.error(
      `Invalid --style "${flag}". Choose: ${Object.keys(WRITING_STYLES).join(', ')}`,
    )
    process.exit(1)
  }

  return { key, text: WRITING_STYLES[key] }
}
