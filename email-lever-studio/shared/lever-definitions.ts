import type { ColdContext, LeverSuggestion } from './schema.ts'

function section(label: string, value: string, definition: string): string[] {
  return [`${label} — ${value}`, definition, '']
}

function lookup<T extends string>(
  map: Record<T, string>,
  category: string,
  value: string,
): string | undefined {
  const def = map[value as T]
  if (!def) {
    console.warn(`[lever-definitions] missing ${category} definition for: ${value}`)
  }
  return def
}

function boolKey(value: boolean): 'true' | 'false' {
  return value ? 'true' : 'false'
}

function assetOrNone(value: string | undefined): string {
  return value?.trim() ? value.trim() : 'none provided'
}

export const LEVER_DEFINITIONS = {
  intent: {
    book_meeting:
      'The email must get the prospect to book a meeting or call. Make the calendar ask clear and low-friction.',
    drive_purchase:
      'The email must motivate a purchase or pricing-page visit. Connect product value to a buying decision.',
    get_reply:
      'The email must earn a written reply. Keep friction minimal — curiosity or relevance should motivate a response.',
    click_to_page:
      'The email must drive a click to a specific page. The link destination must feel worth the click.',
    collect_info:
      'The email must get the prospect to share information — answer a question, fill a form, or provide details.',
    referral:
      'The email must motivate a referral or introduction to someone else who would benefit.',
  },
  framework: {
    PAS: 'Problem → Agitate → Solution. Open by naming the exact pain the prospect lives with. Sentence 2–3 makes that pain worse — cost, consequence, what they\'re missing. Only then introduce the product as the relief. Never lead with the product.',
    AIDA: 'Attention → Interest → Desire → Action. Hook with something surprising or bold. Build interest with relevant facts or a scenario. Create desire by connecting product to outcome they want. Close with a single clear action.',
    BAB: 'Before → After → Bridge. Paint the current painful state in one line. Paint the better future state in the next. The product is the bridge that gets them there. Keep it tight — three beats, no padding.',
    FAB: 'Feature → Advantage → Benefit. Name what the product does. Explain why that matters mechanically. Land on what the reader actually gets as a result. Repeat for 2–3 key points max.',
    QUEST: 'Qualify → Understand → Educate → Stimulate → Transition. Open by signaling exactly who this is for, so the reader self-identifies. Show you understand their specific situation. Teach them one useful thing related to the problem. Stimulate interest in solving it. Transition smoothly into the ask — never a hard pivot.',
    AIDCA: 'Attention → Interest → Desire → Conviction → Action. Same as AIDA, but before the close insert one concrete proof point — a stat, result, or credibility marker — that makes the desire feel justified, not just felt. Then close with the action.',
    ACCA: 'Awareness → Comprehension → Conviction → Action. Surface the issue so the reader recognizes it exists. Explain plainly how it works or why it happens. State clearly why your solution is the right response. End with a direct, unambiguous action step.',
    'Star-Story-Solution': 'Star → Story → Solution. Introduce a compelling character or subject (often the sender, a customer, or the prospect themselves) in one line. Tell a brief story of their struggle or situation. Resolve it by introducing the product as the solution that closed the story.',
    'Star-Chain-Hook': 'Star → Chain → Hook. Open with an attention-grabbing element or claim (the Star). Build a short chain of logical or emotional reasons that support it. End on a Hook — a specific, timely reason to act now.',
    PASTOR: 'Problem → Amplify → Story → Transformation → Offer → Response. Name the problem, then amplify its cost briefly. Ground it in a short story (yours or a customer\'s) that shows the problem resolved. Describe the transformation achieved. State the offer plainly. Close with a specific, low-friction response you want.',
    Because: 'Claim/Ask + Because + Reason. State the ask directly, then justify it in the same breath with "because [specific, relevant reason]." The reason should be concrete and tied to the reader\'s situation — not generic. One sentence, no build-up.',
    'Slippery Slide': 'No fixed stages — line-by-line momentum. Every sentence\'s only job is to get the next sentence read. Keep sentences short, curiosity-driven, and low-resistance. Avoid front-loading the ask or the pitch; let it emerge only after the reader is already several lines in.',
    'Value Prop (Pain/Gain/Job)': 'Pain → Gain → Job-to-be-done. Name the specific pain or friction the reader is dealing with. State the gain or outcome they actually want. Frame the product as what helps them get that "job" done — not as a feature list.',
    '4 Us': 'Urgent → Unique → Useful → Ultra-specific. Apply this to the headline or subject line only. Make sure it conveys time-sensitivity, stands out from generic asks, promises real value, and uses a specific detail (number, name, timeframe) rather than a vague claim.',
    '4 Cs': 'Clear → Concise → Compelling → Credible. Use as an edit pass, not a writing structure. Strip ambiguity so the ask can\'t be misread. Cut every unnecessary word. Make sure there\'s one compelling reason to care. Back any claim with something credible — a fact, number, or specific detail.',
    'Hook-Story-Offer': 'Hook → Story → Offer. Open with a specific, scroll-stopping line relevant to the reader. Add one line of context or credibility — no more. Close with a clear, low-commitment offer or ask.',
    PPPP: 'Picture → Promise → Prove → Push. Paint a picture of the desired outcome. State the promise — what the product delivers. Prove it with a fact, result, or credibility marker. Push for action with urgency or a clear next step.',
    SLAP: 'Stop → Look → Act → Purchase. Open with something that stops the scroll or the skim. Hold attention long enough for the reader to actually look at the offer. Prompt a small action. Close by connecting that action to the purchase or ultimate ask.',
    none: 'No fixed structure. Write naturally and conversationally. Let the logic flow from the context rather than a formula.',
  },
  emotion: {
    fear: 'Surface a specific risk, threat, or loss the prospect hasn\'t fully confronted. Make it concrete — not "you might lose customers" but "your competitors are already doing this." Don\'t be cruel; be truthful. The product resolves the threat.',
    aspiration: 'Paint a vivid picture of the better version of the reader\'s situation. Speak to ambition, growth, status, achievement. The product is the vehicle to that version of themselves.',
    curiosity: 'Open a loop the reader cannot close without reading on. A surprising fact, a counterintuitive claim, or a half-revealed insight. Never reveal everything in the subject line or opener.',
    humor: 'Use one well-placed moment of levity — a self-aware observation, a gentle absurdity. Never joke about the prospect\'s pain. Humor lowers guard; the point still lands seriously.',
    fomo: 'Reference what peers, competitors, or similar companies are already doing or gaining. Make inaction feel like being left behind, not just a missed opportunity.',
    status: 'Appeal to being seen as smart, ahead of the curve, or part of a selective group. The product elevates how the reader is perceived by others or by themselves.',
    pain_relief: 'Stay close to the daily friction the reader feels. Be specific about the symptom — the tedious task, the recurring problem, the thing that shouldn\'t take this long. Product removes the friction.',
  },
  persuasion: {
    reciprocity: 'Give something genuinely useful before the ask — an insight, a reframe, a piece of advice. The ask feels natural after value has been delivered.',
    authority: 'Establish credibility through specifics — a result, a client name, a credential, a number. Don\'t claim authority; demonstrate it with evidence.',
    scarcity: 'Name a real constraint — time, availability, cohort size, pricing window. Vague scarcity ("act now!") is ignored. Specific scarcity ("we\'re onboarding 3 new accounts this month") is believed.',
    liking: 'Write warmly. Find common ground — shared frustration, shared goal, shared context. People buy from people they like. Tone matters more than tactics here.',
    commitment: 'Start with a small yes — a truth the reader already agrees with, a micro-commitment. Build from that agreement toward the ask. Never open with the full ask.',
    none: 'No specific persuasion technique. Let the value of the offer speak plainly.',
  },
  specificity: {
    hard_numbers: 'Use at least one specific number in the body — percentage, time saved, dollar amount, customer count, days, or rate. Vague claims are not allowed. If you don\'t have a real number from context, use a reasonable illustrative range and signal it ("teams typically see…").',
    vague: 'Write in general, relatable language. No fabricated statistics. Focus on the shape of the benefit, not a specific measurement.',
  },
  personalizationDepth: {
    generic: 'No personalization. Could be sent to anyone. Speak to a broad pain or desire shared by the full audience.',
    merge_field: 'Use the recipient name in the greeting or subject. One personal touch — everything else is broadcast copy.',
    segment_tailored: 'Write for a specific role, industry, or company size. Reference their world — their terminology, their typical challenges, their context. Do not use a generic greeting.',
    one_to_one_researched: 'Write as if you\'ve studied this specific person. Reference their company, their likely situation, a specific detail from notes. The email should feel impossible to have been sent to anyone else. Use everything in notes.',
  },
  subjectType: {
    question: 'Ask the prospect something that makes them pause — ideally about their own situation. Best when paired with curiosity or pain_relief emotion.',
    statement: 'Make a bold claim or declare something surprising. Works with authority or aspiration.',
    curiosity_gap: 'Hint at something without revealing it. "The mistake most finance teams make" — forces the open. Never clickbait; must pay off inside.',
    list: 'Promise a specific number of things: "3 ways to…" Only use when body is scannable.',
    announcement: 'Declare something new, changed, or available. Works with an active offer or drive_purchase intent.',
  },
  subjectLength: {
    short: 'Under 40 characters. Punchy, single idea. Best for mobile.',
    medium: '40–60 characters. Room for context and hook together.',
    long: '60–80 characters. Use only when complexity genuinely requires it.',
  },
  subjectCasing: {
    sentence: 'Capitalise first word only. Feels personal, like a human wrote it. Default for cold outreach.',
    title: 'Every Major Word Capitalised. More formal; use for announcements or high-authority contexts.',
    lowercase: 'all lowercase. Maximum casual/personal feel. Use sparingly — only for humor or liking contexts.',
  },
  subjectUrgency: {
    true: 'Convey time sensitivity in the subject — a deadline, limited window, or reason to act now. Be specific, not hype.',
    false: 'No urgency language in the subject. Avoid "act now", "limited time", or pressure tactics.',
  },
  subjectEmoji: {
    true: 'Include exactly one relevant emoji in the subject line. Use sparingly; must match tone.',
    false: 'No emoji in the subject line.',
  },
  subjectNumber: {
    true: 'Include a specific number in the subject (e.g. "3 ways", "40%", "10 min").',
    false: 'No numbers in the subject line.',
  },
  subjectPersonalization: {
    true: 'Include the recipient\'s name or company in the subject line.',
    false: 'Do not personalize the subject with name or company.',
  },
  preheaderPresent: {
    true: 'Write a preheader that appears in inbox preview alongside the subject.',
    false: 'Omit preheader entirely from output (empty string).',
  },
  preheaderLength: {
    short: 'Keep preheader under 50 characters — one sharp supporting line.',
    medium: 'Preheader 50–100 characters — room for a secondary hook or detail.',
  },
  preheaderRelationship: {
    complements: 'Preheader adds new information — a second hook, a supporting detail, a secondary benefit. Subject + preheader together are more compelling than either alone.',
    repeats: 'Preheader reinforces the subject line\'s message with slightly different wording. Use only when the subject idea is strong enough to double down on.',
  },
  senderNameType: {
    personal: 'Sign off as an individual person. Use a first name. Feels like 1:1 outreach.',
    company: 'Sign off as the company brand. More formal; use when authority of the org matters.',
    hybrid: 'Combine personal name with company — e.g. "Alex from Acme". Balances trust and brand.',
  },
  senderReplyTo: {
    true: 'Write as if replies go directly to the sender. Encourage hitting reply.',
    false: 'No explicit reply-to framing; neutral sign-off.',
  },
  bodyLength: {
    short: 'Under 75 words. One pain, one product mention, one CTA. Every word justified. No padding.',
    medium: '75–150 words. Room for a story beat or one proof point. Two–three short paragraphs.',
    long: '200+ words. Full narrative. Use framework structure across multiple beats. Requires strong hook or reader drops off.',
  },
  bodyFormat: {
    plain: 'Plain text only. No HTML tags.',
    html: 'Use light HTML — simple tags like <p>, <strong>, <a>, <ul>/<li> where appropriate.',
  },
  bodyLinkCount: {
    zero: 'No links in the body.',
    one: 'Include exactly one link. Make it the primary CTA destination.',
    two_plus: 'Include two or more links. Each must serve a distinct purpose.',
  },
  bodyReadingLevel: {
    simple: 'Write at a simple reading level — short words, short sentences, no jargon.',
    moderate: 'Moderate complexity — some industry terms OK if the audience expects them.',
    advanced: 'Write for a sophisticated reader — technical precision and nuance are appropriate.',
  },
  scannable: {
    true: 'Use 2–4 bullet points or one bold phrase to break the wall of text. Bullets must each carry a distinct point — no padding bullets.',
    false: 'Plain prose only. No bullets, no bold. Conversational flow.',
  },
  socialProofType: {
    none: 'Do not reference any proof. No "teams like yours," no implied endorsements.',
    volume: 'Reference the number of customers, users, or companies. "Over 400 finance teams use…" Only if customerCount asset is present.',
    name_drop: 'Name a recognisable customer. "Used by [Company]." Only if recognizableCustomer asset is present. Never invent names.',
    peer: 'Reference companies similar to the recipient without naming them. "Teams like yours…" or "Other [industry] companies…" Safe when no named assets exist.',
    result: 'State a specific outcome. "Cut reconciliation time by 60%." Only if specificResult asset is present. Never fabricate numbers.',
    quote: 'Use a short customer quote. Only if customerQuote asset is present. Never invent quotes.',
    recency: 'Reference something recent — a new win, a recent milestone. Only if recentWin asset is present.',
    consensus: 'Imply broad adoption — "most teams in [space] now…" Use carefully; only when the claim is genuinely defensible.',
  },
  socialProofPlacement: {
    opener: 'Lead with the proof. Makes authority the first impression. Best for name_drop and consensus.',
    body: 'Place proof in the middle, after the pain setup and before the CTA. Best for result and peer.',
    pre_cta: 'Place proof immediately before the call to action. Removes last-second hesitation. Best for quote and result.',
    ps: 'Place proof in a P.S. line after the main email. Good for recency or when proof feels forced in the body.',
  },
  socialProofSpecificity: {
    vague: 'You may write general proof language ("teams like yours", "many of our customers") without needing a specific asset.',
    specific: 'Use only concrete proof from provided assets. If the relevant asset is missing, do not fabricate — omit social proof entirely.',
  },
  ctaType: {
    reply: 'Ask for a written reply. Lowest friction. e.g. "Would this be worth a quick conversation?"',
    book: 'Direct to a calendar link. Use only if body includes at least one link.',
    buy: 'Direct to a purchase or pricing page. Only for drive_purchase intent.',
    read: 'Direct to content — article, case study, page. Must include a link.',
    download: 'Offer a resource. Must include a link. Best with reciprocity persuasion.',
  },
  ctaStyle: {
    plain_reply_ask: 'Write as a natural sentence asking for a reply. No button, no link. e.g. "Would you be open to a quick chat?"',
    link: 'Hyperlink a short phrase. "See how it works →" or "Book a time here."',
    button: 'Only valid when body format is html. Render as a styled button element.',
  },
  ctaCount: {
    one: 'Include exactly one call to action in the email.',
    two: 'Include two distinct calls to action — primary and secondary. Do not compete equally; one should be clearly primary.',
  },
  ctaPlacement: {
    inline: 'Place the CTA within the body copy, not only at the end.',
    end: 'Place the CTA at the end of the email, after the main argument.',
    both: 'Include a soft CTA inline and a stronger CTA at the end.',
  },
  offerType: {
    percent_off: 'State the percentage clearly. "20% off your first 3 months." Pair with scarcity for urgency.',
    dollar_off: 'State the dollar amount. "$200 off onboarding fee." Concrete and tangible.',
    free_trial: 'Name the trial length and what\'s included. "Full access, no card required, 14 days."',
    bonus: 'Name the bonus specifically. Vague bonuses ("and more!") are worthless.',
    bundle: 'Name what\'s bundled. "Includes setup, training, and dedicated support."',
    guarantee: 'State exactly what\'s guaranteed and for how long. "If you don\'t see results in 30 days, we\'ll refund in full."',
  },
  offerScarcity: {
    time_limited: 'Name the deadline explicitly. "Offer expires Friday." Never use vague urgency like "act fast."',
    quantity_limited: 'Name the constraint. "We\'re onboarding 5 new accounts this quarter." Must be plausible.',
    none: 'No scarcity language. Present the offer plainly without pressure.',
  },
} as const

function appendSection(
  lines: string[],
  label: string,
  value: string,
  map: Record<string, string>,
  category: string,
): void {
  const def = lookup(map, category, value)
  if (def) lines.push(...section(label, value, def))
}

function formatSocialProofAssetRules(
  context: ColdContext | undefined,
  levers: LeverSuggestion,
): string[] {
  const sp = levers.socialProof.values
  const assets = context?.socialProofAssets ?? {}
  const hasAssets = [
    assets.recognizableCustomer,
    assets.specificResult,
    assets.customerQuote,
    assets.customerCount,
    assets.recentWin,
  ].some((value) => Boolean(value?.trim()))

  if (!hasAssets && sp.type === 'none') return []

  const lines = [
    'SOCIAL PROOF ASSETS (from research — use in body):',
    `- Recognizable customer: ${assetOrNone(assets.recognizableCustomer)}`,
    `- Specific result: ${assetOrNone(assets.specificResult)}`,
    `- Customer quote: ${assetOrNone(assets.customerQuote)}`,
    `- Customer count: ${assetOrNone(assets.customerCount)}`,
    `- Recent win: ${assetOrNone(assets.recentWin)}`,
    '',
    'SOCIAL PROOF RULES:',
  ]

  if (sp.type === 'none') {
    lines.push(
      '- Research returned proof above. Include at least one concrete proof point in the email body.',
      '- Do not fabricate additional proof beyond what is listed.',
    )
  } else {
    lines.push(
      '- If specificity is "specific" AND the relevant asset is "none provided": do not fabricate proof. Omit social proof entirely.',
      '- Match proof type to asset: recognizableCustomer for name_drop, specificResult for result, customerQuote for quote, customerCount for volume, recentWin for recency.',
      '- For peer and consensus, use recognizableCustomer if available, otherwise general peer language.',
      '- You MUST include at least one proof point from the assets above when any asset is provided.',
    )
  }

  lines.push('')
  return lines
}

export function buildLeverInstructions(
  levers: LeverSuggestion,
  context?: ColdContext,
): string {
  const lines: string[] = ['## Lever Instructions', '']

  const cs = levers.copyStrategy.values
  const sl = levers.subjectLine.values
  const ph = levers.preheader.values
  const sender = levers.sender.values
  const body = levers.body.values
  const sp = levers.socialProof.values
  const cta = levers.cta.values
  const offer = levers.offer.values

  appendSection(lines, 'INTENT', levers.intent.value, LEVER_DEFINITIONS.intent, 'intent')
  appendSection(lines, 'FRAMEWORK', cs.framework, LEVER_DEFINITIONS.framework, 'framework')
  appendSection(lines, 'EMOTION', cs.emotion, LEVER_DEFINITIONS.emotion, 'emotion')
  appendSection(lines, 'PERSUASION', cs.persuasion, LEVER_DEFINITIONS.persuasion, 'persuasion')
  appendSection(lines, 'SPECIFICITY', cs.specificity, LEVER_DEFINITIONS.specificity, 'specificity')
  appendSection(
    lines,
    'PERSONALIZATION',
    cs.personalizationDepth,
    LEVER_DEFINITIONS.personalizationDepth,
    'personalizationDepth',
  )

  appendSection(lines, 'SUBJECT TYPE', sl.type, LEVER_DEFINITIONS.subjectType, 'subjectType')
  appendSection(lines, 'SUBJECT LENGTH', sl.length, LEVER_DEFINITIONS.subjectLength, 'subjectLength')
  appendSection(lines, 'SUBJECT CASING', sl.casing, LEVER_DEFINITIONS.subjectCasing, 'subjectCasing')
  appendSection(
    lines,
    'SUBJECT URGENCY',
    boolKey(sl.urgency),
    LEVER_DEFINITIONS.subjectUrgency,
    'subjectUrgency',
  )
  appendSection(
    lines,
    'SUBJECT EMOJI',
    boolKey(sl.emoji),
    LEVER_DEFINITIONS.subjectEmoji,
    'subjectEmoji',
  )
  appendSection(
    lines,
    'SUBJECT NUMBER',
    boolKey(sl.numberIncluded),
    LEVER_DEFINITIONS.subjectNumber,
    'subjectNumber',
  )
  appendSection(
    lines,
    'SUBJECT PERSONALIZATION',
    boolKey(sl.personalizationToken),
    LEVER_DEFINITIONS.subjectPersonalization,
    'subjectPersonalization',
  )

  if (!ph.present) {
    lines.push('PREHEADER — omit', LEVER_DEFINITIONS.preheaderPresent.false, '')
  } else {
    appendSection(
      lines,
      'PREHEADER',
      boolKey(ph.present),
      LEVER_DEFINITIONS.preheaderPresent,
      'preheaderPresent',
    )
    appendSection(
      lines,
      'PREHEADER LENGTH',
      ph.length,
      LEVER_DEFINITIONS.preheaderLength,
      'preheaderLength',
    )
    appendSection(
      lines,
      'PREHEADER VS SUBJECT',
      ph.relationship,
      LEVER_DEFINITIONS.preheaderRelationship,
      'preheaderRelationship',
    )
  }

  appendSection(
    lines,
    'SENDER NAME',
    sender.nameType,
    LEVER_DEFINITIONS.senderNameType,
    'senderNameType',
  )
  appendSection(
    lines,
    'SENDER REPLY-TO',
    boolKey(sender.replyToSet),
    LEVER_DEFINITIONS.senderReplyTo,
    'senderReplyTo',
  )

  appendSection(lines, 'BODY LENGTH', body.length, LEVER_DEFINITIONS.bodyLength, 'bodyLength')
  appendSection(lines, 'BODY FORMAT', body.format, LEVER_DEFINITIONS.bodyFormat, 'bodyFormat')
  appendSection(lines, 'BODY LINKS', body.linkCount, LEVER_DEFINITIONS.bodyLinkCount, 'bodyLinkCount')
  appendSection(
    lines,
    'READING LEVEL',
    body.readingLevel,
    LEVER_DEFINITIONS.bodyReadingLevel,
    'bodyReadingLevel',
  )
  appendSection(
    lines,
    'SCANNABLE',
    boolKey(body.scannable),
    LEVER_DEFINITIONS.scannable,
    'scannable',
  )

  appendSection(lines, 'SOCIAL PROOF', sp.type, LEVER_DEFINITIONS.socialProofType, 'socialProofType')
  if (sp.type !== 'none') {
    appendSection(
      lines,
      'SOCIAL PROOF PLACEMENT',
      sp.placement,
      LEVER_DEFINITIONS.socialProofPlacement,
      'socialProofPlacement',
    )
    appendSection(
      lines,
      'SOCIAL PROOF SPECIFICITY',
      sp.specificity,
      LEVER_DEFINITIONS.socialProofSpecificity,
      'socialProofSpecificity',
    )
  }

  appendSection(lines, 'CTA TYPE', cta.type, LEVER_DEFINITIONS.ctaType, 'ctaType')
  appendSection(lines, 'CTA STYLE', cta.style, LEVER_DEFINITIONS.ctaStyle, 'ctaStyle')
  appendSection(lines, 'CTA COUNT', cta.count, LEVER_DEFINITIONS.ctaCount, 'ctaCount')
  appendSection(lines, 'CTA PLACEMENT', cta.placement, LEVER_DEFINITIONS.ctaPlacement, 'ctaPlacement')

  lines.push(`CTA COPY — use exactly: "${levers.cta.ctaCopy}"`, '')

  if (!offer.hasOffer) {
    lines.push('OFFER — none', 'No offer language.', '')
  } else {
    appendSection(lines, 'OFFER TYPE', offer.type, LEVER_DEFINITIONS.offerType, 'offerType')
    if (offer.magnitude?.trim()) {
      lines.push(`OFFER MAGNITUDE — ${offer.magnitude}`, `State the offer magnitude clearly: ${offer.magnitude}.`, '')
    }
    appendSection(
      lines,
      'OFFER SCARCITY',
      offer.scarcity,
      LEVER_DEFINITIONS.offerScarcity,
      'offerScarcity',
    )
  }

  lines.push(...formatSocialProofAssetRules(context, levers))

  return lines.join('\n').trimEnd()
}
