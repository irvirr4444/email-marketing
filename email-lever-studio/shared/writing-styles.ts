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

export const STYLE_AUTHOR_DESCRIPTIONS: Record<StyleKey, string> = {
  kennedy:
    'Dan Kennedy — Direct-response marketing strategist known for his "No B.S." book series and blunt, no-nonsense teaching style. He built his reputation coaching entrepreneurs, financial advisors, and info-marketers on selling through sequenced follow-up rather than one-off pitches. He is a foundational influence on the modern info-marketing and coaching industry.',
  ogilvy:
    'David Ogilvy — Often called "The Father of Advertising," he founded Ogilvy & Mather and wrote the classic Confessions of an Advertising Man. He championed research-driven, benefit-focused copy long before "data-driven marketing" was a buzzword. His famous line "the consumer isn\'t a moron, she\'s your wife" still gets quoted today.',
  kern:
    'Internet marketer who helped popularize the "product launch" email sequence in the online business world. He is known for blending direct-response principles with a casual, conversational tone in his emails. His "Mass Control" course influenced a generation of online course creators.',
  chaperon:
    'Andre Chaperon — Email marketer best known for pioneering narrative-driven "soap opera sequences" — autoresponder emails structured like serialized story episodes. He built a cult following through his "Tiny Little Businesses" philosophy of small, sustainable online ventures. His work shifted email marketing away from hard pitches toward story-based engagement.',
  halbert:
    'Gary Halbert — Legendary direct-mail copywriter famous for writing some of the highest-converting sales letters in advertising history. His letters to his son, later published as The Boron Letters, remain a cult classic copywriting text. He was known for a gritty, street-smart persuasion style built on deep customer psychology.',
  schwartz:
    'Eugene Schwartz — Copywriter and author of Breakthrough Advertising, considered one of the most important copywriting books ever written. He developed the concept of "market sophistication" and stages of customer awareness, which still underpins modern funnel and email strategy. He wrote copy for major mail-order businesses and mentored many copywriters who came after him.',
  albuquerque:
    'Evaldo Albuquerque — Email copywriter best known for his work at Agora Financial, where he became one of the highest-paid copywriters in the financial newsletter space. He is known for combining storytelling with financial promotions to drive massive subscription sales. He later taught his methods through courses aimed at aspiring email copywriters.',
  makepeace:
    'Clayton Makepeace — One of the highest-earning direct-response copywriters in history, specializing in health and financial newsletter promotions. He was known for emotionally charged, benefit-driven copy that generated huge mailing list revenues for publishers like Agora and Boardroom. He also mentored copywriters through his training programs before his passing in 2016.',
  brunson:
    'Russell Brunson — Entrepreneur and co-founder of ClickFunnels, a software platform that popularized "sales funnels" for online businesses. He is the author of bestsellers like DotCom Secrets and Expert Secrets, which teach funnel-building and offer creation. He built a large following by combining product launches with community-driven marketing events.',
  bencivenga:
    'Gary Bencivenga — Widely regarded by peers as one of the greatest copywriters alive before his retirement, earning the nickname "the copywriter\'s copywriter." He wrote long-running control ads for financial and health publishers with unusually high response rates. His retirement seminar, later compiled as the "Bencivenga 100," is still studied by copywriters today.',
  carlton:
    'John Carlton — Direct-response copywriter known for his gritty, punchy, no-fluff writing style and decades of work in fitness, business opportunity, and marketing niches. He is often cited alongside Halbert as a master of "street" copywriting that speaks plainly to real people. He later taught copywriting through his "Marketing Rebel" training programs.',
  settle:
    'Ben Settle — Email marketing specialist known for popularizing daily, personality-driven emails as a standalone sales channel rather than just a supporting tool. He publishes the long-running Email Players newsletter, teaching copywriters and business owners to sell via short, opinionated daily emails. He is credited with helping shift small-business email marketing away from "newsletter" style toward direct, frequent selling.',
}

export function resolveStyle(
  key: StyleKey,
): { key: StyleKey; text: string; author: string; description: string } {
  return {
    key,
    text: WRITING_STYLES[key],
    author: STYLE_AUTHOR_LABELS[key],
    description: STYLE_AUTHOR_DESCRIPTIONS[key],
  }
}
