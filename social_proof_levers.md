# Social Proof Variable System
### A modular framework for generating scoped social proof — pick your variables, get exactly what you need, nothing more.

---

## Why this exists

The original two mega-prompts (Researcher + Copywriter) generate everything at once: 7 proof layers × 7 output formats in a single wall of text. That's overkill for almost every real use case. This system breaks it into **4 independent variables**. You select a value for each, plug them into the master prompt at the bottom, and get a tightly scoped output — not a dossier.

**Total possible configurations: 7 × 7 × 4 × 3 = 588.** You'll never need all of them. You need one at a time.

---

## VARIABLE 1 — LAYER (the proof source)

*What kind of evidence are we mining? Multi-select — pick 1 or combine 2-3 for fused claims.*

| Layer | What it pulls | What it produces | Best for |
|---|---|---|---|
| **Ingredient / Material / Technology** | Historical use, scientific/clinical backing, cultural associations, famous uses, global prevalence of what's *in* the product | "This works because of what it's made of" — science- and specificity-driven claims | Supplements, skincare, food, tech products with real components |
| **Origin / Geography** | What the region is known for, quality designations, famous brands/figures from there, regional dominance stats | "This works because of where it's from" — heritage and inherited-trust claims | Food, wine, textiles, craft goods, anything with a strong "made in X" story |
| **Industry / Market** | Market size (USD), CAGR, adoption stats, trend reports, media coverage of the category | "This is a smart, validated space to be in right now" — timing and legitimacy claims | New/trending categories, investor-facing copy, "why now" messaging |
| **Behavioral / Social** | How many people already do this behavior, demographic breakdowns, cultural precedent, expert-recommended behaviors | "You're not alone / you're joining something big" — belonging and herd-proof claims | Habit-based products, wellness, community-driven brands |
| **Expert / Authority** | Studies, meta-analyses, statements from named institutions (WHO, Harvard, Mayo, MIT, trade bodies), professional endorsement patterns | "Credentialed people back this" — institutional trust claims | Health, science-adjacent, B2B, anything needing credibility over hype |
| **Direct Product** | Typical review platforms, average category ratings, common testimonial themes — ONLY real if actual review data exists | Customer-voice proof — *use with caution, do not fabricate reviews* | Established products with real review history |
| **Company / Brand** | Certifications, regulatory bodies, industry associations typical to the category, founding/size/history if known | "The company itself is legitimate" — institutional-brand trust claims | B2B, high-consideration purchases, anything where "who makes this" matters |

**Key rule:** Turning a layer on/off doesn't just add/remove facts — it changes the *character* of the brand story.
- Ingredient ON + Origin OFF → "This works because of science."
- Origin ON + Ingredient OFF → "This works because of heritage."
- These are two different brand identities from the same product. Choose deliberately, don't just select everything.

---

## VARIABLE 2 — OUTPUT FORMAT (the deliverable shape)

*What channel or asset are we producing? Multi-select — you can request several formats from the same layer selection.*

| Format | What you get | Length/shape | Use it for |
|---|---|---|---|
| **Headlines** | 10 punchy, fact-driven headline options, varied by lead-type (stat/history/expert/behavior/origin) | 1 line each | Landing page hero, ad titles, subject lines |
| **Trust Bullets** | 15 short, skeptic-proof bullet points, one proof point per bullet | 1 line each, no fluff | Landing page feature sections, one-pagers |
| **Story Block** | 1 brand-narrative paragraph fusing geography + ingredient proof into heritage | ~80 words | About page, product description intro |
| **Stat Stack** | 5 standalone visual-ready stats, format: [Big number] + [context line] | 5 short stat cards | Landing page visual sections, infographics |
| **Ad Hooks** | 5 opening lines for paid social (FB/IG/TikTok) leading with borrowed/adjacent proof | 1 line each | Ad copy first lines, scroll-stoppers |
| **Email Paragraph** | 1 paragraph combining market + behavioral + ingredient proof for a new subscriber | ~100 words | Welcome/nurture email |
| **Objection Killers** | 5 common objections paired with a proof-based one-liner rebuttal | Objection → Killer pairs | Sales pages, FAQ, ad comment responses |

---

## VARIABLE 3 — TONE (the voice)

*Single-select. This is the variable most likely to get skipped — don't skip it. Same facts, wildly different brand feel.*

| Tone | Sounds like | Example shift on the same fact |
|---|---|---|
| **Luxury** | Restrained, confident, understated, no exclamation points | "Cultivated in regions cataloged since antiquity for this exact purpose." |
| **Mass-market** | Energetic, accessible, benefit-forward | "People have been doing this for 3,000+ years — turns out they were onto something." |
| **Clinical** | Precise, sourced, no embellishment, reads like a spec sheet | "Documented use dates to approximately 1000 BCE (Source: [institution])." |
| **Casual-friend** | Warm, plainspoken, like a smart friend explaining why to trust it | "Okay so this isn't new — people have literally been doing this for thousands of years." |

---

## VARIABLE 4 — DEPTH (compression level)

*Single-select. Controls how much you get back.*

| Depth | What happens |
|---|---|
| **Quick** | 3–5 of the strongest points only. No exhaustive lists. Best for a first draft or when you just need a gut check. |
| **Full** | Exhaustive — every proof point the model can find within the selected layer(s). Best for building a master reference doc. |
| **Fused** | Skips individual points entirely and produces ONLY 3–5 sentences that combine 2-3 layers into single powerful claims. Best for final polished copy, not research. |

---

## Worked Examples

**Scenario A — Supplement brand, wants scientific credibility**
- Layer: Ingredient + Expert
- Format: Stat Stack
- Tone: Clinical
- Depth: Quick
→ Output: 5 tight, sourced stat cards about the ingredient's clinical backing. No geography, no market hype.

**Scenario B — Olive oil brand, wants heritage story**
- Layer: Origin + Behavioral
- Format: Story Block
- Tone: Casual-friend
- Depth: Full
→ Output: One warm, detailed paragraph tying Mediterranean tradition + widespread modern ritual use into a founder-story-style narrative.

**Scenario C — Trending wellness product, wants ad performance**
- Layer: Industry/Market + Behavioral
- Format: Ad Hooks
- Tone: Mass-market
- Depth: Quick
→ Output: 5 scroll-stopping opening lines leaning on "everyone's already doing this" + category growth stats.

**Scenario D — B2B SaaS, wants to kill sales objections**
- Layer: Company/Brand + Expert
- Format: Objection Killers
- Tone: Clinical
- Depth: Full
→ Output: 5 objection/rebuttal pairs grounded in certifications, institutional backing, and named authority sources — no fluff, no market-size flexing.

---

## The Master Selector Prompt

Copy this, fill in the brackets, paste your product description at the bottom.

```
You are a social proof strategist. I will give you a product description and a set of SCOPE VARIABLES. Only work within the scope I define — do not generate layers or formats I didn't select. Do not default to the full 7-layer system.

LAYERS TO USE (select only these — ignore all others even if relevant):
[list from: Ingredient/Material/Technology, Origin/Geography, Industry/Market, Behavioral/Social, Expert/Authority, Direct Product, Company/Brand]

OUTPUT FORMAT (produce only this):
[choose one or more: Headlines / Trust Bullets / Story Block / Stat Stack / Ad Hooks / Email Paragraph / Objection Killers]

TONE: [Luxury / Mass-market / Clinical / Casual-friend]

DEPTH: [Quick (3-5 points) / Full (exhaustive) / Fused (cross-layer combined claims only)]

RULES:
- Never fabricate statistics. If a number is approximate or estimated, say so explicitly.
- Use ONLY the layers listed above, even if other proof is obvious or tempting to include.
- Match the tone strictly — do not default to generic corporate language.
- If a selected layer has no real data available for this specific product, say so rather than inventing it.
- Stay within the requested depth — do not pad Quick requests or compress Full requests.

PRODUCT DESCRIPTION:
[paste here]
```

---

## Quick-pick cheat sheet

If you don't know where to start, match your goal to a preset:

| Your goal | Layer | Format | Tone | Depth |
|---|---|---|---|---|
| "I need a landing page hero fast" | Ingredient + Origin | Headlines | Match your brand | Quick |
| "I need to build a full credibility doc for my team" | All 7 | — (use Prompt 1 style) | Clinical | Full |
| "I need one killer About page paragraph" | Origin + Behavioral | Story Block | Casual-friend or Luxury | Full |
| "I need ad copy that converts cold traffic" | Market + Behavioral | Ad Hooks | Mass-market | Quick |
| "I need to handle sales objections" | Expert + Company/Brand | Objection Killers | Clinical | Full |
| "I need a hero stat section for the page" | Any 2 layers | Stat Stack | Match your brand | Quick |