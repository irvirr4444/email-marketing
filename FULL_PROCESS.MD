# Frontend Design Brief: Email Lever Studio — Single-Page Generator

## Product overview

**Email Lever Studio** is a cold-outreach email generator. The user provides minimal input — a **Company** and a **Product** — and the system automatically:

1. Fetches and reads the company and product web pages (when URLs are provided)
2. Researches social proof from those pages (ingredients, reviews, retail partners, awards, etc.)
3. AI-suggests email "levers" (strategic copy decisions: intent, framework, emotion, CTA style, social proof type, etc.)
4. Writes a complete cold email draft using those levers

The user does **not** configure levers manually on v1. They only see what the AI chose **after** generation, alongside the finished email. The levers panel explains *why* the email looks the way it does.

**Positioning:** "Paste your company and product → get a research-backed cold email in ~20 seconds."

**Audience:** Marketers, founders, and salespeople who want a fast first draft without writing prompts or configuring copy strategy.

---

## Page structure

**One single page. No navigation. No multi-step wizard.**

### Layout zones

| Zone | Purpose |
|------|---------|
| **Header** | Product name + one-line tagline |
| **Input panel** | Two fields + one primary button |
| **Loading overlay / panel** | Shown during generation; animated progress |
| **Results panel** | Hidden until complete; shows email + levers side by side (desktop) or stacked (mobile) |

---

## Inputs (only 2 visible fields)

### Field 1 — Company

- **Label:** `Company`
- **Placeholder:** `Provence Beauty` or `https://www.provencebeauty.com`
- **Accepts:** Company name **or** company homepage URL
- **Helper text (subtle):** "Name or website URL"

### Field 2 — Product

- **Label:** `Product`
- **Placeholder:** `Dew Beaucoup Peptide Plumping Serum` or product page URL
- **Accepts:** Product name/description **or** product page URL
- **Helper text (subtle):** "Name, description, or product page URL"

### Primary action

- **Button label:** `Generate Email`
- **State:** Disabled when either field is empty; shows spinner + "Generating…" when active
- **No other visible controls** on v1 (no campaign picker, no intent picker, no style picker)

### Hidden defaults (backend — do not show in UI v1)

| Setting | Default |
|---------|---------|
| Campaign | `"Cold D2C"` |
| Intent | `get_reply` |
| Social proof research | **Always on** |
| Research layers | `ingredient, direct, company, origin` |
| Research tone | `clinical` |
| Research depth | `full` |
| Recipient | `"Hi there,"` (cold prospect) |
| Writing style | none |

If the user pastes URLs, the frontend should pass them as `companyUrl` / `productUrl`. If they paste plain text, pass as `companyName` / `productDescription`. Smart detection: if value starts with `http://` or `https://`, treat as URL.

---

## User flow (states)

### State 1 — Idle (initial)

- Empty or filled inputs
- `Generate Email` button enabled when both fields have content
- No results visible
- Clean, minimal, confident aesthetic

### State 2 — Generating (loading)

Triggered immediately on button click.

**Duration:** ~15–30 seconds (3 sequential AI API calls + optional page fetching).

**UX requirements:**

- Inputs become disabled (read-only grayed)
- Button shows loading state (spinner, "Generating…")
- A **loading panel** appears below inputs OR as a centered overlay
- Show **step-by-step progress** with animated transitions between steps
- Each completed step gets a checkmark; current step pulses or has a subtle shimmer
- Optional: skeleton placeholders where the email and levers will appear
- Optional: subtle ambient animation (soft gradient shift, typing dots, progress bar filling left-to-right)

**Progress steps to display (in order):**

| Step | User-facing label | What's happening |
|------|-------------------|------------------|
| 1 | `Reading your pages` | Fetching company + product URLs; extracting title, price, reviews, ingredients, retail partners |
| 2 | `Researching social proof` | AI mines proof from page content across selected layers |
| 3 | `Choosing email strategy` | AI suggests levers (intent, framework, emotion, social proof type, CTA, etc.) |
| 4 | `Writing your email` | AI writes subject + body using chosen levers |

**Error state:** If any step fails, stop animation, show friendly error ("Something went wrong — try again"), re-enable inputs and button. Do not leave user stuck in loading.

### State 3 — Success (results)

Loading disappears. Results panel animates in (fade + slide up, ~300ms).

**Two main sections:**

#### A. Email output (primary, left or top)

Display the generated email as a **readable email card**, not raw JSON.

**Email card contents:**

- **Subject line** — prominent, bold, copyable
- **Preheader** — only if present (usually omitted for cold emails); smaller muted text
- **Body** — plain text with line breaks preserved; looks like a real email preview
- **Sign-off** — included in body (e.g. "Best, Claire")

**Email card actions (secondary buttons):**

- `Copy subject`
- `Copy email`
- `Copy all`

Optional: subtle "Regenerate" icon for v2 — not required v1.

#### B. Levers panel (secondary, right or below)

Title: **"Strategy behind this email"** or **"Levers used"**

Show the AI's strategic decisions as **readable cards or chips**, not raw API JSON.

**Primary levers to highlight (summary row — always visible):**

| Lever | Example value | Human label |
|-------|---------------|-------------|
| Intent | `get_reply` | Get Reply |
| Framework | `PAS` | PAS (Problem → Agitate → Solution) |
| Emotion | `aspiration` | Aspiration |
| Persuasion | `authority` | Authority |
| Body length | `short` | Short |
| Personalization | `merge_field` | Merge-field |
| Social proof | `name_drop` | Name drop |
| CTA type | `read` | Soft read ask |
| Style | `none` | Default |

**Expandable detail (optional but recommended):**

Below the summary, show **lever cards** grouped by category. Each card shows:

- Card name (e.g. "Copy Strategy", "Social Proof", "Subject Line", "CTA")
- Selected values as pills/tags
- One-line **AI reasoning** per card (from `levers.{card}.reasoning`)

**Full lever cards in the API (for expandable view):**

| Card | Fields to show |
|------|----------------|
| **Intent** | value + reasoning |
| **Subject Line** | length, type, urgency, emoji, casing |
| **Preheader** | present (usually false) |
| **Sender** | name type (personal/company), reply-to |
| **Body** | length, format (plain), reading level |
| **Copy Strategy** | framework, emotion, persuasion, specificity, personalization depth |
| **Social Proof** | type, placement, specificity + which asset was used |
| **CTA** | type, count, style + `ctaCopy` string |
| **Offer** | hasOffer (usually false for cold) |

**Social proof assets panel (bonus section):**

If research ran, show a collapsible **"Proof discovered"** section with the 5 researched assets:

| Asset | Example |
|-------|---------|
| Recognizable customer | "Available at Ulta…" |
| Specific result | "Copper peptides + hyaluronic acid + niacinamide…" |
| Customer count | "55 verified reviews" |
| Recent win | "Alpha-bet Élixir Award Winner; DEW BEAUCOUP new launch" |
| Customer quote | (empty if no real quotes on page) |

This connects the research step to the final email and makes the tool feel intelligent.

---

## Visual design direction

**Tone:** Premium but approachable. Feels like a creative tool, not enterprise SaaS.

**Suggested aesthetic:**

- Light mode default; soft off-white background (`#FAFAF8` or similar)
- One accent color (warm terracotta, deep indigo, or sage green — skincare-adjacent brands should feel clean and modern)
- Generous whitespace; single-column centered layout max-width ~960px
- Input fields: large, rounded, subtle border; focus ring on accent color
- `Generate Email` button: full-width on mobile, prominent accent fill, slight hover lift
- Email preview card: white surface, soft shadow, monospace or serif for subject optional
- Lever chips: small rounded pills, muted background, accent border on "primary" levers (framework, intent, social proof)
- Loading: smooth step indicator (vertical timeline on mobile, horizontal on desktop)

**Typography:**

- UI: clean sans-serif (Inter, Geist, or similar)
- Email preview body: slightly larger line-height (1.6–1.7) for readability

**Motion:**

- Button: scale 0.98 on press
- Loading steps: staggered fade-in; checkmark draw animation on complete
- Results: fade + slide up; email card appears first, levers panel 150ms later
- No flashy or distracting animations — calm confidence

**Responsive:**

- Desktop: email left (~60%), levers right (~40%)
- Mobile: email first, levers below; sticky `Generate Email` optional

---

## Backend pipeline (how generation works)

```
User clicks Generate Email
        ↓
[Step 1] Fetch pages (if URLs provided)
        ↓
[Step 2] POST /api/research-social-proof
        → SocialProofAssets (5 proof fields)
        ↓
[Step 3] POST /api/suggest-levers
        → LeverSuggestion (AI picks strategy)
        ↓
[Step 4] Override intent to get_reply (hidden default)
        ↓
[Step 5] POST /api/generate-draft
        → EmailDraft (subject + body)
        ↓
Display email + levers + proof discovered
```

### Social proof research (Step 2)

Built on the variable system from `social_proof_levers.md`:

| Variable | Options | Default for UI |
|----------|---------|----------------|
| **Layers** | ingredient, origin, industry, behavioral, expert, direct, company | ingredient, direct, company, origin |
| **Tone** | clinical, mass_market, luxury, casual | clinical |
| **Depth** | quick, full, fused | full |

Research mines proof from page content (when URLs provided) or product description. Output maps to 5 email-ready asset fields:

| Field | Used for |
|-------|----------|
| `recognizableCustomer` | Name drop, peer proof |
| `specificResult` | Result proof |
| `customerQuote` | Quote proof |
| `customerCount` | Volume proof |
| `recentWin` | Recency proof |

**Source priority when URLs are provided:**

1. Facts from fetched page content (highest priority)
2. Sender-provided description
3. Category inference (lowest — avoid inventing)

### Lever suggestion (Step 3)

AI reads context + social proof assets and suggests values for all lever cards:

- Intent, Subject Line, Preheader, Sender, Body, Copy Strategy, Social Proof, CTA, Offer

Each card includes a `reasoning` string explaining why that choice was made.

### Email generation (Step 5)

AI writes the email following every lever instruction exactly. Uses `GENERATE_DRAFT_SYSTEM_PROMPT` + lever definitions from `shared/lever-definitions.ts`.

---

## API contract (what the frontend calls)

Base URL: `http://127.0.0.1:3001` (dev) or production API URL.

### Step 0 — Health check

```
GET /api/health → { ok: true }
```

### Step 1 — Research social proof

```
POST /api/research-social-proof
{
  "companyUrl": "https://...",
  "productUrl": "https://...",
  "productDescription": "optional if no URL",
  "config": {
    "layers": ["ingredient", "direct", "company", "origin"],
    "tone": "clinical",
    "depth": "full"
  }
}
→ SocialProofAssets {
  recognizableCustomer, specificResult, customerQuote,
  customerCount, recentWin
}
```

### Step 2 — Suggest levers

```
POST /api/suggest-levers
{
  "context": {
    "recipientName": "there",
    "recipientEmail": "prospect@example.com",
    "companyName": "Provence Beauty",
    "segmentAtSend": "cold_prospect",
    "sequenceNumber": 1,
    "notes": "Campaign: Cold D2C\n\nDew Beaucoup Peptide Plumping Serum",
    "socialProofAssets": { ... from step 1 }
  },
  "levers": { ...default empty lever template }
}
→ LeverSuggestion (full lever object with reasoning per card)
```

### Step 3 — Override intent (client-side, before generate)

Set `levers.intent.value = "get_reply"` and framework from intent mapping.

### Step 4 — Generate draft

```
POST /api/generate-draft
{
  "context": { ...same as step 2 },
  "levers": { ...from step 2, intent overridden }
}
→ EmailDraft {
  subject: string,
  preheader?: string,
  body: string
}
```

**Frontend orchestration:** Run steps 1 → 2 → 4 sequentially. Update loading UI between each step. Total ~3 API round trips.

---

## Example end-to-end (real output)

**Inputs:**

- Company: `Provence Beauty` or `https://www.provencebeauty.com`
- Product: `https://www.provencebeauty.com/collections/serums-oils/products/dew-beaucoup-peptide-serum`

**Generated email:**

**Subject:** The peptide fine lines fix

**Body:**

```
Hi there,

Fine lines show up faster than most skincare can keep up with. Most serums hydrate on the surface but never touch collagen, so the lines just come back.

Provence Beauty, sold at Ulta, built Dew Beaucoup differently. It pairs Copper Tripeptide-1 for collagen support with Vitamin C THD for tone, and it already has 55 verified reviews from people seeing real results.

Want me to send you the link to check it out?

Best,
Claire
```

**Levers summary:**

- Intent: Get Reply
- Framework: PAS
- Emotion: Aspiration
- Persuasion: Authority
- Body length: Short
- Personalization: Merge-field
- Social proof: Name drop (Ulta)
- CTA: Soft read ask

**Proof discovered:**

- Ulta retail availability
- 55 reviews
- Copper peptides, hyaluronic acid, niacinamide, vitamin C
- Alpha-bet Élixir Award Winner

---

## What NOT to build in v1

- No lever editing / manual overrides
- No campaign or intent pickers
- No batch generation
- No login / auth
- No history / saved drafts
- No writing style selector
- No separate "research only" mode

Keep the surface area minimal: **2 inputs, 1 button, email + levers out.**

---

## Success criteria for the design

1. A new user understands what to do in under 3 seconds
2. Loading feels purposeful (4 named steps), not like a black box
3. The email reads like a real sendable draft, not AI output
4. The levers panel makes the tool feel explainable and trustworthy
5. Copy buttons work; mobile layout is usable
6. The page feels fast, calm, and premium — not cluttered

---

## Related docs

| File | Purpose |
|------|---------|
| `social_proof_levers.md` | Layer/tone/depth variable system for social proof research |
| `social_proof_prompt_preview.md` | Original researcher + copywriter prompt concepts |
| `levers_scenarios.MD` | Human-readable lever spec and scenarios |
| `email-lever-studio/HOW_IT_WORKS.md` | Technical API and CLI reference |
| `email-lever-studio/shared/lever-definitions.ts` | Lever value definitions used in generation |
| `email-lever-studio/server/prompts.ts` | System prompts for research, suggest, generate |
