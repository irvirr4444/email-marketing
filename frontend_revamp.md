# Email Lever Studio — v6 Redesign Prompt

## Context for the AI agent

You are working in the `email-lever-studio/` frontend. Read `LEVER_FRONTEND_REFERENCE.md` (or equivalent reference doc) first to understand the current v5 "Sheet" layout, file structure, and design tokens before touching anything. This prompt describes a v6 redesign. Do not start from scratch — refactor the existing components and `index.css` tokens in place. Preserve all existing functionality (lock semantics, suggest/generate flow, API calls, state shape in `App.tsx`) exactly as-is. This is a **visual and layout redesign only** — no changes to data flow, handlers, or API contracts unless explicitly noted below.

The overall goal: the current UI is too flat, too spaced-out, and too visually uniform — every card has the same weight, the same white background, the same border-radius, the same amount of padding, and there's no hierarchy telling the user what matters. We want something that feels closer to **modern Google product design** (think Gemini, the redesigned Workspace apps, Material 3 Expressive — bigger type contrast, asymmetric card sizing, layered surface tones, more color roles, less uniform whitespace) rather than a generic Material 3 component-library demo.

Work through this prompt section by section. Each section is independently implementable — do them in order, but each can be tested/reviewed on its own.

---

## 1. Reduce and restructure negative space

**Problem:** Sections use `space-y-10` (40px) between every major block regardless of relationship, cards use generous uniform padding, and the bento grid cards sit `items-start` / `h-fit` with lots of breathing room that reads as empty rather than calm.

**Fix:**

- Replace the single global `space-y-10` rhythm with a **two-tier spacing system**:
  - `space-y-3` (12px) between elements that are part of the same logical group (e.g., a card's title and its fields, or two related cards in the same bento row)
  - `space-y-12` (48px) only between the four major sections (Recipient, Draft, Intent, Style) — i.e., make the gap *between* sections bigger than it is now, and the gap *within* sections smaller. Right now everything is roughly equidistant, which is part of why it feels empty — there's no compression anywhere to contrast against.
- Inside `StyleGroupCard.tsx`, reduce card padding from whatever generous default it currently has (look for `p-6`/`p-8`-equivalent values) down to `p-4` for compact cards and `p-5` for the large Subject/Body cards. Reduce the gap between fields inside a card from its current value to `gap-2` / `gap-3`.
- In the bento grid (`.style-bento` in `index.css`), reduce the grid `gap` from its current value to something tighter — aim for `12px` instead of whatever larger gap is currently set (likely `20-24px`). Tight gaps between cards of *different* sizes is what makes bento grids feel intentional rather than sparse; right now the gap is doing the same job as the card size variance, so it reads as redundant whitespace.
- Audit every component for `mb-*`/`mt-*`/`py-*` utility classes that exceed `6` (24px) and justify or reduce each one. Default bias: smaller until it feels dense enough to feel "designed," then back off slightly.

---

## 2. Make the bento grid hierarchy real, not decorative

**Problem:** Card sizes (7/5 split, then 6/6, 6/6) are based on rough field-count parity, not actual importance. This makes the size variation feel arbitrary instead of meaningful, which contributes to the "off" feeling.

**Fix — new grid plan (desktop `lg+`, still 12 columns):**

```
Row 1: Subject Line (8 cols) | Sender + Preheader stacked, compact (4 cols)
Row 2: Body (9 cols, tall)   | Copy Strategy (3 cols, narrow vertical chip stack)
Row 3: CTA (6 cols) | Offer (6 cols)
```

- Subject Line and Body are the two cards that most directly shape the output the user reads — give them dominant size and a slightly elevated treatment (see Section 3) so they visually anchor the grid. Currently every card has equal visual authority; that's the core issue.
- Copy Strategy currently has "many chip fields" per the reference doc — instead of giving it equal width to Body, compress it into a narrow vertical card where chips wrap onto multiple lines. This creates the size contrast that makes bento layouts read as intentional.
- Sender and Preheader (already documented as "compact variant") should be visually de-emphasized further: smaller title text (13px instead of current), tighter padding, maybe a slightly muted background (`--surface-container` instead of `--surface`) so they recede behind Subject Line.
- On `md` (tablet), collapse to the existing 2-column fallback but apply the same width ratios where the grid allows (Subject full-width, Body should still read larger than Copy Strategy).

---

## 3. Introduce a second elevation/surface language for "important" vs "supporting" cards

**Problem:** Everything uses `.elevation-1` or flat `--surface` uniformly. Nothing visually says "this card matters more."

**Fix:**

- Define two new card treatments in `index.css`:
  - `.card-primary` — used for Subject Line, Body, and the Draft card. Slightly larger border-radius (20px instead of the current 16px), a subtle 1px border in `--outline-variant` PLUS a soft shadow (`0 2px 8px rgba(0,0,0,0.06)` or similar — tune by eye), and `--surface` background.
  - `.card-supporting` — used for Sender, Preheader, CTA, Offer, Copy Strategy. Current flat treatment, 16px radius, no shadow, `--surface-container` background so it visually sits "behind" the primary cards.
- This single change — two tiers instead of one flat tier — will do more to fix the "uniform and empty" feeling than almost anything else, because it gives the eye something to differentiate without adding clutter.

---

## 4. Expand the color system beyond single-accent blue

**Problem:** `--primary` (#1A73E8) is used for buttons, selected chips, focus rings, and links — every interactive/active state looks identical regardless of meaning.

**Fix — add these tokens to `index.css` (Material 3 Expressive-style multi-role palette, still Google-blue-rooted, not a redesign of brand identity):**

```css
--secondary: #00696D;           /* teal — use for "AI-suggested" state indicators, auto_awesome icons */
--secondary-container: #B2F1F0;
--tertiary: #6B5C9E;            /* violet — use for locked-card accents, lock icon active state */
--tertiary-container: #E8DEFF;
--success: #1E8E3E;             /* for any future "applied"/"saved" confirmation states */
```

- Locked cards: instead of just `--surface-container-high` background, add a thin left border (`3px solid var(--tertiary)`) so locking has its own distinct color identity instead of just being "more gray."
- AI reasoning lines (`auto_awesome` icon + text) currently render in default text color — recolor the icon to `--secondary` so AI-generated content is visually distinguishable from user input at a glance, consistently across Intent reasoning and every lever card's reasoning line.
- Keep `--primary` reserved strictly for the single most important action per screen (Generate/Regenerate button, selected Intent chip) so it retains meaning instead of being diluted across a dozen UI states.

---

## 5. Increase typographic contrast

**Problem:** Section titles are ~20px Inter, body/labels are ~15-16px Roboto — not enough scale difference to create real hierarchy. Nothing on the page reads as a confident "headline" moment.

**Fix:**

- Section titles ("Who you're writing to", "What's the goal of this email?", "Style"): bump from current size to **28-32px**, Inter 700, tighter line-height (1.1).
- Card titles inside the bento grid stay small (14-15px, Roboto 500) — the contrast between section titles and card titles should be dramatic, not incremental. This is intentional: it's the gap between "this is a chapter" and "this is a setting."
- Draft card subject line: bump from 16px to **20px**, keep Roboto 500.
- Draft card body: keep Source Serif 4 but increase to **17px / 1.7 line-height** (from 15px/1.65) — it's the actual product output, it should feel readable and substantial, not like fine print.

---

## 6. Give the Draft card a distinct "hero" treatment

**Problem:** The draft — the entire point of the tool — is styled identically to every input card around it, just with `.elevation-1`.

**Fix:**

- Apply `.card-primary` (see Section 3) plus extra padding (`p-8` instead of standard card padding) — it should feel like opening a document, not like reading inside a settings panel.
- Background: very subtle warm-white tint distinct from pure `--surface`, e.g. `#FFFEFB` or similar — barely perceptible but enough to feel like "paper" rather than "UI chrome." Confirm this doesn't clash with `--surface-container` used elsewhere; if it reads muddy, skip and keep pure white but rely on the shadow/border/padding to carry the distinction instead.
- Loading state: replace the plain linear progress bar with a **skeleton shimmer** that mimics the shape of subject/preheader/body lines (3-4 shimmering bar placeholders at decreasing width, animating left-to-right). This is a meaningfully better signal for an AI-generation wait than a generic progress bar, and fits the "feels modern" goal directly.
- Empty state: replace the centered muted text with something with a bit more presence — e.g. a large outlined `draft` or `auto_awesome` Material icon at low opacity above the text, so the empty card doesn't feel like a bug/blank state.

---

## 7. Add a scroll-spy step rail (sidebar navigation)

**New feature.** Add a vertical step indicator that tracks scroll position and lets users jump to sections.

**Placement:**
- Desktop (`lg+`): fixed vertical rail on the far left of the viewport, vertically centered, outside the `max-w-[880px]`/`max-w-7xl` content columns. Roughly 64-80px wide. Does not scroll with the page — it's `position: fixed`.
- Tablet/mobile: collapse to a slim horizontal progress bar pinned directly under the sticky `AppBar`, OR a small floating circular step indicator in a bottom corner that expands to a list on tap. Pick the floating-corner approach if implementation time is limited — it's simpler and doesn't compete with the AppBar for space.

**Steps map 1:1 to existing sections:**
1. Recipient
2. Draft
3. Intent
4. Style

**Visual design:**
- Each step is a small circle (8px) connected by a vertical 2px line.
- Upcoming steps: outline-only circle, `--outline` color, line segment below in `--outline-variant`.
- Current step: filled circle in `--primary`, slightly larger (10-12px), with a soft pulse/glow animation (subtle, 1.5s ease-in-out loop, low-opacity box-shadow expansion — don't overdo it).
- Completed steps (scrolled past): filled circle in `--primary` at reduced opacity (~60%), line segment above filled solid in `--primary`.
- Label text appears to the right of each dot, only at full opacity/weight (Roboto 500, 13px) for the *current* step; other labels render at ~40% opacity and Roboto 400 — this is important, don't show all labels at equal weight or you recreate the same "everything looks equally important" problem from the cards.

**Behavior:**
- Use `IntersectionObserver` on the four section wrapper elements (give each section a stable `id` and `ref` if not already present — e.g. `id="section-recipient"`, `id="section-draft"`, `id="section-intent"`, `id="section-style"`).
- Whichever section has the largest visible intersection ratio at any scroll position is the "current" step. Use a threshold array (e.g. `[0, 0.25, 0.5, 0.75, 1]`) and a small debounce/rAF throttle to avoid jitter from rapid threshold firing.
- Clicking a step: `document.getElementById(...).scrollIntoView({ behavior: 'smooth', block: 'start' })`. Account for the sticky AppBar height by adding `scroll-margin-top: 80px` (or the AppBar's actual height) to each section element so the scrolled-to position isn't hidden under the sticky header.
- The connecting line between dots should visually "fill" proportionally as the user scrolls *through* a section, not just jump fully-filled/empty at section boundaries — i.e., track scroll progress as a percentage within the current section's bounding box and animate the line fill (a `transform: scaleY()` on an inner fill element, transitioning smoothly via `requestAnimationFrame`, not CSS transition alone, since this needs to track continuous scroll position).

**Component:**
- New file: `src/components/StepRail.tsx`.
- No new global state needed in `App.tsx` — this component manages its own local state (current step index, scroll progress) via the IntersectionObserver and a scroll listener, entirely self-contained. It does not need to know about `levers`, `draft`, or any existing app state — purely a DOM/scroll-position concern.
- Style in `index.css` under a new `.step-rail` block, consistent with the existing motion system documented in the reference doc — use the same easing/duration conventions already established (`.expand-collapse` is 200ms, `.lock-settle` is 240ms; keep the step-rail's fill animation in that same ~200-250ms range for consistency, except the continuous scroll-fill tracking which should feel directly tied to scroll, not animated on a fixed timer).

---

## 8. Reduce chip-taxonomy density in Copy Strategy / CTA cards

**Problem:** Several cards (Copy Strategy especially) are described as having "many chip fields," which contributes to a forms-wizard feeling rather than a creative tool feeling.

**Fix (lower priority than 1-7, do this last if time allows):**
- In `StyleField.tsx`, for cards with more than ~5 segmented/chip fields, group related chips under a small uppercase micro-label (11px, `--on-surface-variant`, letter-spacing 0.05em) so they read as organized clusters rather than a flat wall of chips.
- Do not change the underlying field data model (`CARD_DEFINITIONS` in `shared/schema.ts`) — this is purely a rendering/grouping change in how `StyleField.tsx` lays out chips for a given card, not a schema change.

---

## Acceptance checklist

Before considering this done, verify:

- [ ] No section uses uniform `space-y-10` everywhere — spacing is now tiered (tight within groups, larger between major sections)
- [ ] Bento grid has visible size asymmetry that maps to Subject Line / Body being dominant
- [ ] Two distinct card surface treatments exist and are applied correctly (`.card-primary` vs `.card-supporting`)
- [ ] At least 3 new color roles are in use somewhere visible (not just defined and unused)
- [ ] Section titles are visibly, dramatically larger than card titles
- [ ] Draft card has a skeleton loading state, not a plain progress bar
- [ ] Step rail exists, tracks scroll via IntersectionObserver, animates a fill, and clicking each step scrolls to the right section accounting for the sticky AppBar offset
- [ ] All existing functionality (lock toggle, suggest-levers, generate/regenerate, copy-to-clipboard) still works unmodified
- [ ] `prefers-reduced-motion` still disables/shortens the new animations (step rail pulse, skeleton shimmer) consistent with the existing reduced-motion handling