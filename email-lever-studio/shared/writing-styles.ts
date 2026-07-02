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

  halbert: `## Writing Style — Gary Halbert (Street-Smart Direct Mail)

Write like you're talking to one real person, not "the market." Use "I" and "you" constantly.
Open with curiosity or a personal stake — raise what happens if this doesn't work before you sell the fix.
Never explain, always tell a story — bury the lesson inside a specific, human anecdote.
Give the reader "eye relief": short paragraphs, easy pacing, nothing dense enough to make them stop reading.
Clarity beats clever every time. If a line doesn't move the sale forward, cut it.`,

  schwartz: `## Writing Style — Eugene Schwartz (Market Awareness / Breakthrough)

Before writing a word, diagnose the reader: what stage of awareness are they at, and how sophisticated is this market?
Never invent desire — find the desire that already exists and channel it. The headline intensifies what they already feel; it doesn't manufacture something new.
Match the claim to the awareness stage: unaware readers need the problem named first; most-aware readers can take the product claim head-on.
Keep sentences short and images simple — a reader can only complete a picture that isn't overloaded with detail.
State the promise in the fewest, most direct words possible, then verbalize it harder with specifics, speed, and sensory language.`,

  albuquerque: `## Writing Style — Evaldo Albuquerque (Big Domino / One Belief)

Before writing, isolate the single belief that, if accepted, makes the entire sale inevitable. Everything else in the copy exists to build that one belief.
Frame the whole pitch as one sentence: this new opportunity is the key to their desire, attainable only through this specific mechanism.
Name a common enemy early — give the reader something to stand against, not just something to want.
Answer objections in sequence, not all at once: uniqueness, self-interest, proof, then objections — in that order.
Keep the argument narrow and escalating. One belief, one throughline, no detours.`,

  makepeace: `## Writing Style — Clayton Makepeace (Dominant Emotion / Force of the Promise)

Identify the single biggest, most believable promise the product can make before writing anything else — the whole piece exists to deliver on it.
Pick one dominant emotion driving this specific reader (fear, hope, anger, pride) and write every section to that one emotion, not a scattered mix.
Bridge new claims to beliefs the reader already holds: start from something they already know is true, then connect it forward to the new idea.
Treat the guarantee as persuasive copy, not boilerplate — write it with the same care as the headline.
Never let a promotion go stale — re-angle the same offer with a new hook or new proof rather than starting over.`,

  brunson: `## Writing Style — Russell Brunson (Story-Funnel / Attractive Character)

Write like a consistent character the reader already knows, not a company — first person, personality intact, page to page.
Every message needs three parts: a hook that stops them, a story that earns belief, and a clear offer — if one is missing, the piece doesn't work yet.
Sell identity and opportunity, not features — the reader should picture becoming someone, not just owning something.
Open loops like a soap opera: build toward an "epiphany" moment that leads naturally into the product, and don't resolve everything in one message.
Always know where this piece sits on the value ladder — the ask should match how much trust has already been built.`,

  bencivenga: `## Writing Style — Gary Bencivenga (Fascination-Driven Proof)

Assume the reader's real objection is quiet disbelief ("yeah, sure") — every claim needs to earn trust before it earns a sale.
Pair every claim with immediate proof — a number, a study, a specific result — never let an assertion sit unsupported.
Write fascinations, not summaries: short, specific, curiosity-loaded lines that pull the reader to the next one instead of telling them everything at once.
Aim the message at the reader's real self-interest, stated with precision — vague benefits read as filler.
Close on an explicit, low-risk guarantee — remove the last reason to hesitate in the final lines, not just at the top.`,

  carlton: `## Writing Style — John Carlton (Punchy Street Copy)

Write like you're leaning across a bar telling a friend something wild that's actually true.
Dig for the one odd, specific, almost-too-strange-to-be-fake detail — that's the real headline, not the generic benefit.
Handle objections upfront, casually, before the pitch — "even if," "doesn't matter if" — so the promise lands on a reader who's already disarmed.
Keep it conversational and short — contractions, fragments, real rhythm. Never sound like copy.
Never hype a claim you don't pay off — every big promise needs a believable, specific reason behind it.`,

  settle: `## Writing Style — Ben Settle (Daily Infotainment)

Write like a personal letter, not a broadcast — plain text energy, no polish, no corporate hedging.
Open with a story or opinion that has nothing obviously to do with the offer, then bend it toward the pitch.
Say what you actually think, even if it's blunt or divisive — safe, agreeable copy gets ignored.
Entertain first, sell second — if the story isn't worth reading on its own, the pitch won't save it.
End on one clear, low-friction ask. Assume you'll email again tomorrow, so nothing needs to be crammed into this one.`,
} as const

export type StyleKey = keyof typeof WRITING_STYLES

export const STYLE_AUTHOR_LABELS: Record<StyleKey, string> = {
  kennedy: 'Dan Kennedy',
  ogilvy: 'David Ogilvy',
  kern: 'Frank Kern',
  chaperon: 'Andre Chaperon',
  halbert: 'Gary Halbert',
  schwartz: 'Eugene Schwartz',
  albuquerque: 'Evaldo Albuquerque',
  makepeace: 'Clayton Makepeace',
  brunson: 'Russell Brunson',
  bencivenga: 'Gary Bencivenga',
  carlton: 'John Carlton',
  settle: 'Ben Settle',
}

export function resolveStyle(
  key: StyleKey,
): { key: StyleKey; text: string; author: string } {
  return {
    key,
    text: WRITING_STYLES[key],
    author: STYLE_AUTHOR_LABELS[key],
  }
}
