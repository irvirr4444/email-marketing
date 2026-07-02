# Lever Definitions Library + Prompt Injection Spec

This file defines TWO things:
1. What each lever value means in writing terms (the library)
2. How to inject the selected values into the Claude prompt (the format)

---

## PART A — THE LIBRARY
### For every possible lever value: what the writer must do

---

### FRAMEWORK

| Value | What to do |
|-------|-----------|
| `PAS` | **Problem → Agitate → Solution.** Open by naming the exact pain the prospect lives with. Sentence 2–3 makes that pain worse — cost, consequence, what they're missing. Only then introduce the product as the relief. Never lead with the product. |
| `AIDA` | **Attention → Interest → Desire → Action.** Hook with something surprising or bold. Build interest with relevant facts or a scenario. Create desire by connecting product to outcome they want. Close with a single clear action. |
| `BAB` | **Before → After → Bridge.** Paint the current painful state in one line. Paint the better future state in the next. The product is the bridge that gets them there. Keep it tight — three beats, no padding. |
| `FAB` | **Feature → Advantage → Benefit.** Name what the product does. Explain why that matters mechanically. Land on what the reader actually gets as a result. Repeat for 2–3 key points max. |
| `QUEST` | **Qualify → Understand → Educate → Stimulate → Transition.** Open by signaling exactly who this is for, so the reader self-identifies. Show you understand their specific situation. Teach them one useful thing related to the problem. Stimulate interest in solving it. Transition smoothly into the ask — never a hard pivot. |
| `AIDCA` | **Attention → Interest → Desire → Conviction → Action.** Same as AIDA, but before the close insert one concrete proof point — a stat, result, or credibility marker — that makes the desire feel justified, not just felt. Then close with the action. |
| `ACCA` | **Awareness → Comprehension → Conviction → Action.** Surface the issue so the reader recognizes it exists. Explain plainly how it works or why it happens. State clearly why your solution is the right response. End with a direct, unambiguous action step. |
| `Star-Story-Solution` | **Star → Story → Solution.** Introduce a compelling character or subject (often the sender, a customer, or the prospect themselves) in one line. Tell a brief story of their struggle or situation. Resolve it by introducing the product as the solution that closed the story. |
| `Star-Chain-Hook` | **Star → Chain → Hook.** Open with an attention-grabbing element or claim (the Star). Build a short chain of logical or emotional reasons that support it. End on a Hook — a specific, timely reason to act now. |
| `PASTOR` | **Problem → Amplify → Story → Transformation → Offer → Response.** Name the problem, then amplify its cost briefly. Ground it in a short story (yours or a customer's) that shows the problem resolved. Describe the transformation achieved. State the offer plainly. Close with a specific, low-friction response you want. |
| `Because` | **Claim/Ask + Because + Reason.** State the ask directly, then justify it in the same breath with "because [specific, relevant reason]." The reason should be concrete and tied to the reader's situation — not generic. One sentence, no build-up. |
| `Slippery Slide` | **No fixed stages — line-by-line momentum.** Every sentence's only job is to get the next sentence read. Keep sentences short, curiosity-driven, and low-resistance. Avoid front-loading the ask or the pitch; let it emerge only after the reader is already several lines in. |
| `Value Prop (Pain/Gain/Job)` | **Pain → Gain → Job-to-be-done.** Name the specific pain or friction the reader is dealing with. State the gain or outcome they actually want. Frame the product as what helps them get that "job" done — not as a feature list. |
| `4 Us` | **Urgent → Unique → Useful → Ultra-specific.** Apply this to the headline or subject line only. Make sure it conveys time-sensitivity, stands out from generic asks, promises real value, and uses a specific detail (number, name, timeframe) rather than a vague claim. |
| `4 Cs` | **Clear → Concise → Compelling → Credible.** Use as an edit pass, not a writing structure. Strip ambiguity so the ask can't be misread. Cut every unnecessary word. Make sure there's one compelling reason to care. Back any claim with something credible — a fact, number, or specific detail. |
| `Hook-Story-Offer` | **Hook → Story → Offer.** Open with a specific, scroll-stopping line relevant to the reader. Add one line of context or credibility — no more. Close with a clear, low-commitment offer or ask. |
| `PPPP` | **Picture → Promise → Prove → Push.** Paint a picture of the desired outcome. State the promise — what the product delivers. Prove it with a fact, result, or credibility marker. Push for action with urgency or a clear next step. |
| `SLAP` | **Stop → Look → Act → Purchase.** Open with something that stops the scroll or the skim. Hold attention long enough for the reader to actually look at the offer. Prompt a small action. Close by connecting that action to the purchase or ultimate ask. |
| `none` | No fixed structure. Write naturally and conversationally. Let the logic flow from the context rather than a formula. |

---

### INTENT → FRAMEWORK (recommended pairings)

When intent is set, pick **one** framework from that intent's list (best fit for context).

| Intent | Recommended frameworks |
|--------|------------------------|
| `book_meeting` | PAS, QUEST, PASTOR, Hook-Story-Offer, Because |
| `drive_purchase` | AIDA, PPPP, AIDCA, FAB, PASTOR |
| `get_reply` | PAS, Because, QUEST, Slippery Slide, Hook-Story-Offer |
| `click_to_page` | AIDA, BAB, FAB, 4 Us, Value Prop (Pain/Gain/Job) |
| `collect_info` | QUEST, PAS, 4 Cs, Because, Value Prop (Pain/Gain/Job) |
| `referral` | Star-Story-Solution, FAB, AIDCA, PASTOR, Because |

---

### EMOTION

| Value | What to do |
|-------|-----------|
| `fear` | Surface a specific risk, threat, or loss the prospect hasn't fully confronted. Make it concrete — not "you might lose customers" but "your competitors are already doing this." Don't be cruel; be truthful. The product resolves the threat. |
| `aspiration` | Paint a vivid picture of the better version of the reader's situation. Speak to ambition, growth, status, achievement. The product is the vehicle to that version of themselves. |
| `curiosity` | Open a loop the reader cannot close without reading on. A surprising fact, a counterintuitive claim, or a half-revealed insight. Never reveal everything in the subject line or opener. |
| `humor` | Use one well-placed moment of levity — a self-aware observation, a gentle absurdity. Never joke about the prospect's pain. Humor lowers guard; the point still lands seriously. |
| `fomo` | Reference what peers, competitors, or similar companies are already doing or gaining. Make inaction feel like being left behind, not just a missed opportunity. |
| `status` | Appeal to being seen as smart, ahead of the curve, or part of a selective group. The product elevates how the reader is perceived by others or by themselves. |
| `pain_relief` | Stay close to the daily friction the reader feels. Be specific about the symptom — the tedious task, the recurring problem, the thing that shouldn't take this long. Product removes the friction. |

---

### PERSUASION

| Value | What to do |
|-------|-----------|
| `reciprocity` | Give something genuinely useful before the ask — an insight, a reframe, a piece of advice. The ask feels natural after value has been delivered. |
| `authority` | Establish credibility through specifics — a result, a client name, a credential, a number. Don't claim authority; demonstrate it with evidence. |
| `scarcity` | Name a real constraint — time, availability, cohort size, pricing window. Vague scarcity ("act now!") is ignored. Specific scarcity ("we're onboarding 3 new accounts this month") is believed. |
| `liking` | Write warmly. Find common ground — shared frustration, shared goal, shared context. People buy from people they like. Tone matters more than tactics here. |
| `commitment` | Start with a small yes — a truth the reader already agrees with, a micro-commitment. Build from that agreement toward the ask. Never open with the full ask. |
| `none` | No specific persuasion technique. Let the value of the offer speak plainly. |

---

### COPY STRATEGY — SPECIFICITY

| Value | What to do |
|-------|-----------|
| `hard_numbers` | Use at least one specific number in the body — percentage, time saved, dollar amount, customer count, days, or rate. Vague claims are not allowed. If you don't have a real number from context, use a reasonable illustrative range and signal it ("teams typically see…"). |
| `vague` | Write in general, relatable language. No fabricated statistics. Focus on the shape of the benefit, not a specific measurement. |

---

### PERSONALIZATION DEPTH

| Value | What to do |
|-------|-----------|
| `generic` | No personalization. Could be sent to anyone. Speak to a broad pain or desire shared by the full audience. |
| `merge_field` | Use the recipient name in the greeting or subject. One personal touch — everything else is broadcast copy. |
| `segment_tailored` | Write for a specific role, industry, or company size. Reference their world — their terminology, their typical challenges, their context. Do not use a generic greeting. |
| `one_to_one_researched` | Write as if you've studied this specific person. Reference their company, their likely situation, a specific detail from notes. The email should feel impossible to have been sent to anyone else. Use everything in `notes`. |

---

### SUBJECT LINE TYPE

| Value | What to do |
|-------|-----------|
| `question` | Ask the prospect something that makes them pause — ideally about their own situation. Best when paired with `emotion = curiosity` or `pain_relief`. |
| `statement` | Make a bold claim or declare something surprising. Works with `authority` or `aspiration`. |
| `curiosity_gap` | Hint at something without revealing it. "The mistake most finance teams make" — forces the open. Never clickbait; must pay off inside. |
| `list` | Promise a specific number of things: "3 ways to…" Only use when `body.scannable = true`. |
| `announcement` | Declare something new, changed, or available. Works with `offer.hasOffer = true` or `intent = drive_purchase`. |

---

### SUBJECT LINE LENGTH

| Value | Character target |
|-------|-----------------|
| `short` | Under 40 characters. Punchy, single idea. Best for mobile. |
| `medium` | 40–60 characters. Room for context and hook together. |
| `long` | 60–80 characters. Use only when complexity genuinely requires it. |

---

### SUBJECT LINE CASING

| Value | What to do |
|-------|-----------|
| `sentence` | Capitalise first word only. Feels personal, like a human wrote it. Default for cold outreach. |
| `title` | Every Major Word Capitalised. More formal; use for announcements or high-authority contexts. |
| `lowercase` | all lowercase. Maximum casual/personal feel. Use sparingly — only for `emotion = humor` or `liking` contexts. |

---

### PREHEADER RELATIONSHIP

| Value | What to do |
|-------|-----------|
| `complements` | Preheader adds new information — a second hook, a supporting detail, a secondary benefit. Subject + preheader together are more compelling than either alone. |
| `repeats` | Preheader reinforces the subject line's message with slightly different wording. Use only when the subject idea is strong enough to double down on. |

---

### BODY LENGTH

| Value | Word target | What to do |
|-------|-------------|-----------|
| `short` | Under 75 words | One pain, one product mention, one CTA. Every word justified. No padding. |
| `medium` | 75–150 words | Room for a story beat or one proof point. Two–three short paragraphs. |
| `long` | 200+ words | Full narrative. Use framework structure across multiple beats. Requires strong hook or reader drops off. |

---

### BODY SCANNABLE

| Value | What to do |
|-------|-----------|
| `true` | Use 2–4 bullet points or one bold phrase to break the wall of text. Bullets must each carry a distinct point — no padding bullets. |
| `false` | Plain prose only. No bullets, no bold. Conversational flow. |

---

### SOCIAL PROOF TYPE

| Value | What to do |
|-------|-----------|
| `none` | Do not reference any proof. No "teams like yours," no implied endorsements. |
| `volume` | Reference the number of customers, users, or companies. "Over 400 finance teams use…" Only if `customerCount` asset is present. |
| `name_drop` | Name a recognisable customer. "Used by [Company]." Only if `recognizableCustomer` asset is present. Never invent names. |
| `peer` | Reference companies similar to the recipient without naming them. "Teams like yours…" or "Other [industry] companies…" Safe when no named assets exist. |
| `result` | State a specific outcome. "Cut reconciliation time by 60%." Only if `specificResult` asset is present. Never fabricate numbers. |
| `quote` | Use a short customer quote. Only if `customerQuote` asset is present. Never invent quotes. |
| `recency` | Reference something recent — a new win, a recent milestone. Only if `recentWin` asset is present. |
| `consensus` | Imply broad adoption — "most teams in [space] now…" Use carefully; only when the claim is genuinely defensible. |

---

### SOCIAL PROOF PLACEMENT

| Value | What to do |
|-------|-----------|
| `opener` | Lead with the proof. Makes authority the first impression. Best for `name_drop` and `consensus`. |
| `body` | Place proof in the middle, after the pain setup and before the CTA. Best for `result` and `peer`. |
| `pre_cta` | Place proof immediately before the call to action. Removes last-second hesitation. Best for `quote` and `result`. |
| `ps` | Place proof in a P.S. line after the main email. Good for `recency` or when proof feels forced in the body. |

---

### CTA TYPE

| Value | What to do |
|-------|-----------|
| `reply` | Ask for a written reply. Lowest friction. "Would this be worth a quick conversation?" |
| `book` | Direct to a calendar link. Use only if `body.linkCount = one` or `two_plus`. |
| `buy` | Direct to a purchase or pricing page. Only for `intent = drive_purchase`. |
| `read` | Direct to content — article, case study, page. Must include a link. |
| `download` | Offer a resource. Must include a link. Best with `persuasion = reciprocity`. |

---

### CTA STYLE

| Value | What to do |
|-------|-----------|
| `plain_reply_ask` | Write as a natural sentence asking for a reply. No button, no link. "Would you be open to a quick chat?" |
| `link` | Hyperlink a short phrase. "See how it works →" or "Book a time here." |
| `button` | Only valid when `body.format = html`. Render as a styled button element. |

---

### OFFER TYPE

| Value | What to do |
|-------|-----------|
| `percent_off` | State the percentage clearly. "20% off your first 3 months." Pair with `scarcity` for urgency. |
| `dollar_off` | State the dollar amount. "$200 off onboarding fee." Concrete and tangible. |
| `free_trial` | Name the trial length and what's included. "Full access, no card required, 14 days." |
| `bonus` | Name the bonus specifically. Vague bonuses ("and more!") are worthless. |
| `bundle` | Name what's bundled. "Includes setup, training, and dedicated support." |
| `guarantee` | State exactly what's guaranteed and for how long. "If you don't see results in 30 days, we'll refund in full." |

---

### OFFER SCARCITY

| Value | What to do |
|-------|-----------|
| `time_limited` | Name the deadline explicitly. "Offer expires Friday." Never use vague urgency like "act fast." |
| `quantity_limited` | Name the constraint. "We're onboarding 5 new accounts this quarter." Must be plausible. |
| `none` | No scarcity language. Present the offer plainly without pressure. |

---

## PART B — HOW TO INJECT INTO THE CLAUDE PROMPT

### The rule: inject only what was picked

After `suggest-levers` returns, look up the definition for each selected value
and build a **Lever Instructions block**. Do not inject the full library —
only the definitions for the values AI just selected.

### Format of the injected block

```
## Lever Instructions

FRAMEWORK — PAS
Problem → Agitate → Solution. Open by naming the exact pain the prospect lives with.
Sentence 2–3 makes that pain worse — cost, consequence, what they're missing.
Onl y then introduce the product as the relief. Never lead with the product.

EMOTION — pain_relief
Stay close to the daily friction the reader feels. Be specific about the symptom —
the tedious task, the recurring problem, the thing that shouldn't take this long.
Product removes the friction.

PERSUASION — authority
Establish credibility through specifics — a result, a client name, a credential, a number.
Don't claim authority; demonstrate it with evidence.

SPECIFICITY — hard_numbers
Use at least one specific number in the body. If you don't have a real number from context,
use a reasonable illustrative range and signal it ("teams typically see…").

PERSONALIZATION — segment_tailored
Write for a specific role, industry, or company size. Reference their world —
their terminology, their typical challenges, their context.

SUBJECT TYPE — question
Ask the prospect something that makes them pause — ideally about their own situation.

SUBJECT LENGTH — short
Under 40 characters. Punchy, single idea.

SUBJECT CASING — sentence
Capitalise first word only. Feels personal, like a human wrote it.

BODY LENGTH — short
Under 75 words. One pain, one product mention, one CTA. Every word justified.

SCANNABLE — false
Plain prose only. No bullets, no bold.

SOCIAL PROOF — none
Do not reference any proof. No implied endorsements.

CTA TYPE — reply
Ask for a written reply. Lowest friction. e.g. "Would this be worth a quick conversation?"

CTA STYLE — plain_reply_ask
Write as a natural sentence asking for a reply. No button, no link.

CTA COPY — use exactly: "{ctaCopy from levers}"

OFFER — none
No offer language.
```

---

### Where in the prompt this block goes

```
[SYSTEM PROMPT — GENERATE_DRAFT_SYSTEM_PROMPT]
  → Your role, campaign, output format rules

[USER PROMPT — three blocks]
  ## Context
    {formatContextForPrompt(context)}

  ## Lever Instructions          ← THIS IS THE NEW BLOCK
    {buildLeverInstructions(levers)}

  ## Writing Style               ← injected if --style flag set
    {styleString}
```

### Implementation: `buildLeverInstructions(levers)`

Create `scripts/lever-definitions.ts`:

```typescript
// Map of every lever value → its writing instruction string
const LEVER_DEFINITIONS = {
  framework: {
    PAS: "Problem → Agitate → Solution. Open by naming...",
    AIDA: "Attention → Interest → Desire → Action...",
    // etc.
  },
  emotion: { ... },
  persuasion: { ... },
  // all levers above
}

// After suggest-levers returns, call this
export function buildLeverInstructions(levers: LeverSuggestion): string {
  const lines: string[] = []

  lines.push(`FRAMEWORK — ${levers.copyStrategy.framework}`)
  lines.push(LEVER_DEFINITIONS.framework[levers.copyStrategy.framework])
  lines.push("")

  lines.push(`EMOTION — ${levers.copyStrategy.emotion}`)
  lines.push(LEVER_DEFINITIONS.emotion[levers.copyStrategy.emotion])
  lines.push("")

  // ... repeat for each lever

  lines.push(`CTA COPY — use exactly: "${levers.cta.ctaCopy}"`)

  return lines.join("\n")
}
```

---

### Why this approach, not alternatives

| Option | Problem |
|--------|---------|
| Inject the full definitions library | Bloated prompt (~3000 tokens of unused definitions). Claude ignores what isn't relevant. |
| Inject just the lever value names | Claude guesses what PAS or hard_numbers means. Inconsistent output across runs. |
| Bake instructions into the system prompt | System prompt becomes enormous and brittle. Adding a new lever value means editing the prompt. |
| **Inject only selected definitions** ← this | ~400–600 tokens. Precise. Portable. The definitions live in one file and compose dynamically. |