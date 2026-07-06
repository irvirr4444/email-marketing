# Email Variables / Style Modal

This document describes the modal opened from an email card to inspect the generated email's strategy variables. In the UI it appears as the **Style** modal, and its body is the list of badges such as:

- `COPY STRATEGY`
- `Intent: Click to Page`
- `Framework: BAB`
- `Emotion: Curiosity`
- `Persuasion: Reciprocity`
- `Specificity: Hard numbers`
- `Personalization: Segment tailored`
- `WRITING STYLE`
- `Author: Frank Kern`

The modal is not an editor. It is a read-only explanation surface for the exact levers attached to a generated email. It answers: **why does this email look, sound, and ask the way it does?**

## Files Involved

The Style modal is composed from three layers:

1. `client/src/dashboard/components/EmailCard.tsx`
   - Owns `variablesOpen`.
   - Decides whether the Style modal should exist for an email.
   - Passes `email.variables` into the modal.

2. `client/src/dashboard/components/EmailVariablesDialog.tsx`
   - Creates the actual modal shell.
   - Supplies modal title, width, close button, scroll area, and content slot.

3. `client/src/dashboard/components/EmailVariables.tsx`
   - Renders the sections and badges inside the modal body.
   - Does not know about modal layout.
   - Only receives an `EmailVariableSnapshot`.

The shared data model and formatting rules live in:

4. `shared/email-variables.ts`
   - Defines `EmailVariableSnapshot`.
   - Defines sections and fields.
   - Converts raw values into display labels.
   - Removes empty / irrelevant values.

The source taxonomy and generator schemas live in:

5. `shared/schema.ts`
   - Defines allowed values for intent, subject line, preheader, body, copy strategy, social proof, CTA, and offer.
   - Defines generation defaults.
   - Normalizes raw AI suggestions into valid lever values.

Writing style labels live in:

6. `shared/writing-styles.ts`
   - Maps internal writing style keys to author names.
   - Stores the full writing prompt text for each author style.
   - Stores `STYLE_AUTHOR_DESCRIPTIONS`, a human-readable background description for each author.
   - `resolveStyle(key)` returns `{ key, text, author, description }`.

The script-facing writing style adapter lives in:

7. `scripts/writing-styles.ts`
   - Re-exports `WRITING_STYLES`, `STYLE_AUTHOR_LABELS`, `resolveStyle`, and `StyleKey` from `shared/writing-styles.ts`.
   - Provides `resolveStyleFromFlag(flag)` for CLI scripts.
   - Validates command-line style keys and exits with the list of valid keys if an invalid style is provided.

The variable glossary lives in:

8. `shared/email-variable-glossary.ts`
   - Defines `EMAIL_VARIABLE_GLOSSARY`, a complete explanatory catalog of email variables.
   - Describes what each field means in plain language.
   - Marks whether each field is currently shown in the Style modal via `shownInStyleModal`.
   - Links fields back to their source lever card and field using `source.card` and `source.field`.
   - Provides per-value meanings for values like `click_to_page`, `BAB`, `hard_numbers`, `segment_tailored`, and author styles.
   - Exports lookup helpers: `getEmailVariableGlossaryField(key)` and `getEmailVariableGlossaryValue(key, value)`.

The persistent database columns are documented in:

9. `db/schema.sql`
   - `generated_email` stores the full lever snapshot across columns like `intent`, `framework`, `emotion`, `cta_type`, `has_offer`, etc.

## Modal Purpose

The Style modal displays the generated email's **strategy fingerprint**. It is not showing the email copy itself. The email card already shows the subject, body, recipients, and performance. This modal shows the hidden generation choices behind that email:

- The strategic goal.
- The copywriting framework.
- The emotional angle.
- The persuasion principle.
- The specificity level.
- The personalization depth.
- The selected author/style model.
- The subject-line design.
- Whether a preheader is used and how it relates to the subject.
- Body length/link/scannability choices.
- Social proof choice and placement.
- CTA type/style/placement/copy.
- Offer presence and offer details.

## User Flow

The flow is:

1. User views an email card.
2. `EmailCard` checks whether the email has visible variables:

```tsx
const hasVariables = getVisibleVariableSections(email.variables).length > 0
```

3. If at least one visible section exists, the Style modal component is mounted:

```tsx
<EmailVariablesDialog
  snapshot={email.variables}
  isOpen={variablesOpen}
  onOpenChange={setVariablesOpen}
/>
```

4. When opened, `EmailVariablesDialog` renders the modal shell.
5. The shell passes the snapshot to `EmailVariables`.
6. `EmailVariables` asks `getVisibleVariableSections(snapshot)` for formatted, filtered sections.
7. Each visible item becomes a badge.

## Modal Shell Design

The Style modal uses the vendored Untitled UI modal primitives from:

```tsx
@ui/components/application/modals/modal
```

The modal structure is:

```tsx
<ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable>
  <Modal className={MODAL_MAX_WIDTH}>
    <Dialog aria-label="Email style" className={`w-full ${MODAL_MAX_WIDTH} outline-hidden`}>
      <div className="flex max-h-[min(85dvh,640px)] w-full flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary_alt">
        <header />
        <scrollable-body />
      </div>
    </Dialog>
  </Modal>
</ModalOverlay>
```

### Overlay

The overlay comes from `ModalOverlay` and uses:

```txt
fixed inset-0 z-50
flex min-h-dvh w-full
items-end justify-center
overflow-y-auto
bg-overlay/70
px-4 pt-4 pb-[clamp(16px,8vh,64px)]
outline-hidden
backdrop-blur-[6px]
sm:items-center sm:justify-center sm:p-8
```

This means:

- It covers the entire viewport.
- It uses `z-50`, so it appears above the app.
- On mobile, the modal sits toward the bottom via `items-end`.
- On `sm` and larger screens, the modal is centered vertically and horizontally.
- The background is a translucent overlay using `bg-overlay/70`.
- The page behind it is blurred with `backdrop-blur-[6px]`.
- It allows vertical scrolling if the modal or viewport requires it.
- It is dismissable by overlay behavior because the modal is passed `isDismissable`.

### Overlay Animation

The overlay animates using React Aria state:

- Entering: `duration-300 ease-out animate-in fade-in`
- Exiting: `duration-200 ease-in animate-out fade-out`

### Modal Container

The `Modal` primitive contributes:

```txt
max-h-full w-full align-middle outline-hidden max-sm:overflow-y-auto max-sm:rounded-xl
```

The Style modal adds:

```txt
max-w-[43rem]
```

The comment in `EmailVariablesDialog.tsx` says:

```tsx
/** max-w-lg (32rem) + 35% ≈ 43rem */
const MODAL_MAX_WIDTH = 'max-w-[43rem]'
```

So the modal is intentionally wider than a small confirmation dialog but much narrower than a full engagement drill-down modal.

### Modal Panel

The visible panel uses:

```txt
flex max-h-[min(85dvh,640px)] w-full flex-col
overflow-hidden
rounded-2xl
bg-primary
shadow-xl
ring-1 ring-secondary_alt
```

This gives it:

- A vertical flex layout.
- A max height of the smaller value between `85dvh` and `640px`.
- A full available modal width.
- Rounded corners: `rounded-2xl`.
- Semantic background: `bg-primary`.
- Large elevation: `shadow-xl`.
- Subtle border/ring: `ring-1 ring-secondary_alt`.
- Hidden outer overflow, so only the modal body scrolls.

### Header

The header uses:

```txt
flex items-center gap-3
border-b border-secondary
px-5 py-3.5 md:px-6
```

It contains:

- Title icon: `StyleStarsIcon`.
- Title text: `Style`.
- Close button: Untitled UI `CloseButton`.

The title uses:

```txt
flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold text-primary
```

The icon uses:

```txt
size-5 shrink-0 text-fg-brand-primary
```

The close button calls:

```tsx
onPress={() => onOpenChange(false)}
```

### Body

The body is the DOM area from the user-selected path:

```txt
flex-1 overflow-y-auto px-5 py-5 md:px-6
```

It means:

- The body takes the remaining height below the header.
- It scrolls independently when content is taller than the max-height panel.
- It has `20px` horizontal and vertical padding on small screens via `px-5 py-5`.
- It has wider horizontal padding on medium screens via `md:px-6`.

Inside this body, `EmailVariables` renders:

```tsx
<div className="space-y-4">
  {sections.map(...)}
</div>
```

So every variable section is separated by `space-y-4`.

## Body Content Design

The body content is a repeated pattern:

1. Section heading.
2. Wrap of variable badges.

### Section Heading

Each section heading uses:

```txt
mb-2
text-xs
font-semibold
uppercase
tracking-[0.12em]
text-tertiary
```

Design implications:

- Always uppercase, even though labels are stored title-cased.
- Small `text-xs` utility.
- Strong label hierarchy with `font-semibold`.
- Letter-spaced by `0.12em`, which gives it the dashboard's "metadata heading" look.
- Muted semantic color via `text-tertiary`.
- `mb-2` separates heading from badges.

### Badge Row

The badge container uses:

```txt
flex flex-wrap gap-2
```

Design implications:

- Badges flow left-to-right.
- Badges wrap onto new lines if the modal is narrow.
- Each badge has `gap-2` spacing.

### Badge Component

Each variable is rendered using Untitled UI `Badge`:

```tsx
<Badge color={item.primary ? 'brand' : 'gray'} size="sm">
  <span className="opacity-80">{item.label}:</span>{' '}
  <span className="font-medium">{item.value}</span>
</Badge>
```

Badge design rules:

- Size is always `sm`.
- Primary fields use `color="brand"`.
- Non-primary fields use `color="gray"`.
- The field label inside a badge is dimmed with `opacity-80`.
- The field value is emphasized with `font-medium`.
- Badge text format is always:

```txt
Label: Value
```

Examples:

```txt
Intent: Click to Page
Framework: BAB
Author: Frank Kern
Scannable: Yes
CTA Copy: Reserve sampling kits
```

## Data Model: `EmailVariableSnapshot`

The modal receives a flattened object called `EmailVariableSnapshot`.

It is intentionally flat because it mirrors generated-email columns and avoids passing the full nested generation object into the dashboard.

```ts
export type EmailVariableSnapshot = {
  intent: string
  framework: string
  emotion: string
  persuasion: string
  specificity: string
  personalization: string
  writingStyle: string | null
  subjectType: string
  subjectLength: string
  subjectCasing: string
  preheaderPresent: boolean
  preheaderLength: string | null
  preheaderRelationship: string | null
  bodyLength: string
  bodyLinks: string
  bodyScannable: boolean
  socialProofType: string
  socialProofPlacement: string | null
  socialProofSpecificity: string | null
  ctaType: string
  ctaStyle: string
  ctaPlacement: string
  ctaCopy: string
  hasOffer: boolean
  offerType: string | null
  offerMagnitude: string | null
}
```

## Glossary Model: `EMAIL_VARIABLE_GLOSSARY`

In addition to the flat snapshot used for rendering badges, the app now has a separate explanatory glossary in:

```txt
shared/email-variable-glossary.ts
```

That file is the long-form documentation layer for the same variable universe. The Style modal uses `EmailVariableSnapshot` and `VARIABLE_SECTIONS` to decide **what appears visually**. The glossary explains **what each field and each possible value means**.

The main export is:

```ts
export const EMAIL_VARIABLE_GLOSSARY = [
  {
    id: string,
    label: string,
    fields: [
      {
        key: string,
        label: string,
        whatItIs: string,
        shownInStyleModal: boolean,
        modalKey?: VariableSectionKey,
        source?: {
          card: string,
          field?: string,
        },
        designNote?: string,
        values?: readonly {
          value: string,
          meaning: string,
          label?: string,
        }[],
        freeForm?: {
          valueLabel: string,
          meaning: string,
        },
      },
    ],
  },
]
```

### Glossary Field Meaning

Each glossary field has:

- `key`: Stable glossary identifier.
- `label`: Human-readable field name.
- `whatItIs`: Plain-English explanation of the field.
- `shownInStyleModal`: Whether this field is currently displayed inside the Style modal.
- `modalKey`: The `EmailVariableSnapshot` / `VariableSectionKey` used by the modal, when one exists.
- `source.card`: The original generation lever card, such as `copyStrategy`, `subjectLine`, `body`, `cta`, or `offer`.
- `source.field`: The original field on that card, such as `framework`, `emotion`, `length`, or `placement`.
- `designNote`: Optional guidance about how the field should be understood or displayed.
- `values`: Allowed values plus plain-English meanings.
- `freeForm`: Used when a field accepts arbitrary text rather than a fixed enum.

### Glossary Lookup Helpers

The glossary exports:

```ts
getEmailVariableGlossaryField(key)
getEmailVariableGlossaryValue(key, value)
```

Use `getEmailVariableGlossaryField(key)` when the UI needs the description of a whole field.

Use `getEmailVariableGlossaryValue(key, value)` when the UI needs the explanation of a specific value.

Example intent lookup:

```ts
getEmailVariableGlossaryValue('intent', 'click_to_page')
```

This resolves to a meaning like:

```txt
The goal is a click-through to a landing page, article, or site - the conversion happens after the email, not inside it.
```

Example framework lookup:

```ts
getEmailVariableGlossaryValue('framework', 'BAB')
```

This resolves to:

```txt
Before, After, Bridge - paint life before the offer, life after it, then show the offer as the bridge between them.
```

### Current Relationship To The Style Modal

Today, the Style modal still renders compact badges from `EmailVariables.tsx`.

The modal does **not yet** render glossary descriptions inline. The current visible UI remains:

```txt
Intent: Click to Page
Framework: BAB
Author: Frank Kern
```

The glossary is available as a source of truth for explanatory UI, such as:

- Tooltip text on badges.
- A help drawer beside the modal.
- Expanded descriptions under each section.
- Documentation pages.
- QA tests that verify the modal and glossary stay aligned.

The important distinction:

- `EmailVariableSnapshot` answers: **what value does this email have?**
- `VARIABLE_SECTIONS` answers: **which values appear in the modal and in what section?**
- `EMAIL_VARIABLE_GLOSSARY` answers: **what does this field/value mean?**

## How Values Reach The Modal

There are two main paths.

### Path 1: From AI Lever Suggestions

When an email is generated, the AI returns a nested `LeverSuggestion`.

`fromLeverSuggestion(levers, styleKey)` converts it into the flat `EmailVariableSnapshot`.

Important mapping:

- `levers.intent.value` -> `intent`
- `levers.copyStrategy.values.framework` -> `framework`
- `levers.copyStrategy.values.emotion` -> `emotion`
- `levers.copyStrategy.values.persuasion` -> `persuasion`
- `levers.copyStrategy.values.specificity` -> `specificity`
- `levers.copyStrategy.values.personalizationDepth` -> `personalization`
- `styleKey` -> `STYLE_AUTHOR_LABELS[styleKey]` -> `writingStyle`
- `levers.subjectLine.values.type` -> `subjectType`
- `levers.subjectLine.values.length` -> `subjectLength`
- `levers.subjectLine.values.casing` -> `subjectCasing`
- `levers.preheader.values.present` -> `preheaderPresent`
- `levers.preheader.values.length` -> `preheaderLength`, only if present
- `levers.preheader.values.relationship` -> `preheaderRelationship`, only if present
- `levers.body.values.length` -> `bodyLength`
- `levers.body.values.linkCount` -> `bodyLinks`
- `levers.body.values.scannable` -> `bodyScannable`
- `levers.socialProof.values.type` -> `socialProofType`
- `levers.socialProof.values.placement` -> `socialProofPlacement`, unless type is `none`
- `levers.socialProof.values.specificity` -> `socialProofSpecificity`, unless type is `none`
- `levers.cta.values.type` -> `ctaType`
- `levers.cta.values.style` -> `ctaStyle`
- `levers.cta.values.placement` -> `ctaPlacement`
- `levers.cta.ctaCopy` -> `ctaCopy`
- `levers.offer.values.hasOffer` -> `hasOffer`
- `levers.offer.values.type` -> `offerType`, only if there is an offer
- `levers.offer.values.magnitude` -> `offerMagnitude`, only if there is an offer

### Path 2: From Database Rows

`fromGeneratedEmailRow(row)` maps a `generated_email` DB row to `EmailVariableSnapshot`.

The database table stores columns such as:

- `intent`
- `subject_type`
- `subject_length`
- `subject_casing`
- `preheader_present`
- `preheader_length`
- `preheader_relationship`
- `body_length`
- `body_links`
- `body_scannable`
- `framework`
- `emotion`
- `persuasion`
- `specificity`
- `personalization_depth`
- `writing_style`
- `social_proof_type`
- `social_proof_placement`
- `social_proof_specificity`
- `cta_type`
- `cta_style`
- `cta_placement`
- `cta_copy`
- `has_offer`
- `offer_type`
- `offer_magnitude`

Fallbacks are applied when DB values are null:

- `framework` -> `none`
- `emotion` -> `curiosity`
- `persuasion` -> `reciprocity`
- `specificity` -> `vague`
- `personalization_depth` -> `generic`
- `writing_style` -> `null`
- `subject_type` -> `statement`
- `subject_length` -> `medium`
- `subject_casing` -> `sentence`
- `preheader_present` -> `false`
- `body_length` -> `medium`
- `body_links` -> `zero`
- `body_scannable` -> `true`
- `social_proof_type` -> `none`
- `cta_type` -> `reply`
- `cta_style` -> `plain_reply_ask`
- `cta_placement` -> `end`
- `cta_copy` -> empty string
- `has_offer` -> `false`

## Section Model

The modal sections are defined by `VARIABLE_SECTIONS`.

The current sections are:

1. `copyStrategy` -> `Copy Strategy`
2. `writingStyle` -> `Writing Style`
3. `subjectLine` -> `Subject Line`
4. `preheader` -> `Preheader`
5. `body` -> `Body`
6. `socialProof` -> `Social Proof`
7. `cta` -> `CTA`
8. `offer` -> `Offer`

Each section declares fields:

```ts
{
  id: 'copyStrategy',
  label: 'Copy Strategy',
  fields: [
    { key: 'intent', label: 'Intent', primary: true },
    { key: 'framework', label: 'Framework', primary: true },
    { key: 'emotion', label: 'Emotion' },
    { key: 'persuasion', label: 'Persuasion' },
    { key: 'specificity', label: 'Specificity' },
    { key: 'personalization', label: 'Personalization' },
  ],
}
```

Fields marked `primary: true` render as brand badges. Other fields render as gray badges.

Primary fields today:

- `Intent`
- `Framework`
- `Author`
- `CTA Type`

## Visibility Rules

The modal does not blindly render every field. It filters in three stages:

1. Map each configured field to a display value.
2. Drop fields whose display value is empty/null.
3. Drop any section that has zero remaining items.

The filtering logic is:

```ts
export function getVisibleVariableSections(snapshot: EmailVariableSnapshot) {
  return VARIABLE_SECTIONS.map((section) => ({
    ...section,
    items: section.fields
      .map((field) => {
        const value = getVariableDisplayValue(snapshot, field.key)
        if (!value) return null
        return { ...field, value }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  })).filter((section) => section.items.length > 0)
}
```

### Values That Are Hidden

A field is hidden if:

- The raw value is `null`.
- The raw value is `undefined`.
- The raw value is an empty string.
- The raw value is `none`.
- The raw value is `—`.
- The special preheader display resolves to `null`.
- The special offer display resolves to `null`.

That means a snapshot can contain a value like:

```ts
socialProofType: 'none'
```

but the modal will not show:

```txt
Social Proof Type: None
```

because `none` is treated as intentionally omitted.

### Preheader Visibility

The preheader section is special.

It has one pseudo-field:

```ts
{ key: 'preheader', label: 'Preheader' }
```

It displays only if:

```ts
snapshot.preheaderPresent === true
```

If present, the display value is:

```txt
<preheaderLength>, <preheaderRelationship>
```

Example:

```txt
Preheader: short, complements
```

Important: this display currently does not apply title-case formatting to `short`, `medium`, `complements`, or `repeats`; it joins the raw values.

If `preheaderPresent` is false, the entire Preheader section disappears.

### Offer Visibility

Offer is also special.

It has one pseudo-field:

```ts
{ key: 'offer', label: 'Offer' }
```

It displays only if:

```ts
snapshot.hasOffer === true
```

If present, the display value is:

```txt
<offerType> <offerMagnitude>
```

Examples:

```txt
Offer: percent_off 15%
Offer: bundle 2-for-1
Offer: free_trial 14 days
```

Important: offer display currently joins raw values and does not run them through a custom label map. So `percent_off` appears as `percent_off`, not `% off`, in this specific modal if it comes through the pseudo-field.

If `hasOffer` is false, the entire Offer section disappears.

### Social Proof Visibility

Social proof has three regular fields:

- `socialProofType`
- `socialProofPlacement`
- `socialProofSpecificity`

If `socialProofType` is `none`, it is hidden.

When `fromLeverSuggestion` builds the snapshot:

- If `socialProofType === 'none'`, placement is set to `null`.
- If `socialProofType === 'none'`, specificity is set to `null`.

So usually the entire Social Proof section disappears when there is no proof.

### Writing Style Visibility

Writing style has one field:

```ts
{ key: 'writingStyle', label: 'Author', primary: true }
```

It displays only if `snapshot.writingStyle` is not null/empty.

When generated from a `styleKey`, it displays the author label, not the internal key.

Example:

```txt
Author: Frank Kern
```

## Display Formatting Rules

Formatting happens in `getVariableDisplayValue` and `formatVariableValue`.

General rules:

- Booleans display as `Yes` or `No`.
- Raw values `none` and `—` are hidden.
- Underscores are replaced with spaces for fields without a specific label map.
- Some fields use explicit label maps.

### Explicit Label Maps

The following keys have custom display maps:

- `intent`
- `persuasion`
- `ctaType`
- `bodyLength`
- `emotion`
- `personalization`
- `specificity`
- `socialProofType`

Everything else falls back to:

```ts
value.replace(/_/g, ' ')
```

This is why:

- `curiosity_gap` displays as `curiosity gap`.
- `plain_reply_ask` displays as `plain reply ask`.
- `two_plus` displays as `two plus`.
- `pre_cta` displays as `pre cta`.

Those fallback values are not title-cased by this modal.

## Every Section And Possible Values

The following sections describe every value the modal can display, based on `EmailVariableSnapshot`, `shared/schema.ts`, `shared/email-variables.ts`, and `shared/writing-styles.ts`.

## 1. Copy Strategy

Section label:

```txt
COPY STRATEGY
```

Fields:

- `Intent` primary badge.
- `Framework` primary badge.
- `Emotion` gray badge.
- `Persuasion` gray badge.
- `Specificity` gray badge.
- `Personalization` gray badge.

### Intent

Snapshot key:

```ts
intent
```

Source:

```ts
levers.intent.value
```

Possible raw values:

- `book_meeting`
- `drive_purchase`
- `get_reply`
- `click_to_page`
- `collect_info`
- `referral`

Displayed labels:

- `book_meeting` -> `Book Meeting`
- `drive_purchase` -> `Drive Purchase`
- `get_reply` -> `Get Reply`
- `click_to_page` -> `Click to Page`
- `collect_info` -> `Collect Info`
- `referral` -> `Referral`

Design:

- Primary badge.
- Brand color.

Example:

```txt
Intent: Click to Page
```

### Framework

Snapshot key:

```ts
framework
```

Source:

```ts
levers.copyStrategy.values.framework
```

Possible raw values:

- `PAS`
- `AIDA`
- `BAB`
- `FAB`
- `QUEST`
- `AIDCA`
- `ACCA`
- `Star-Story-Solution`
- `Star-Chain-Hook`
- `PASTOR`
- `Because`
- `Slippery Slide`
- `Value Prop (Pain/Gain/Job)`
- `4 Us`
- `4 Cs`
- `Hook-Story-Offer`
- `PPPP`
- `SLAP`
- `none`

Displayed labels:

- Most framework values display exactly as stored.
- `none` is hidden entirely.

Design:

- Primary badge.
- Brand color.

Example:

```txt
Framework: BAB
```

### Emotion

Snapshot key:

```ts
emotion
```

Source:

```ts
levers.copyStrategy.values.emotion
```

Possible raw values and display labels:

- `fear` -> `Fear`
- `aspiration` -> `Aspiration`
- `curiosity` -> `Curiosity`
- `humor` -> `Humor`
- `fomo` -> `FOMO`
- `status` -> `Status`
- `pain_relief` -> `Pain relief`

Design:

- Gray badge.

Example:

```txt
Emotion: Curiosity
```

### Persuasion

Snapshot key:

```ts
persuasion
```

Source:

```ts
levers.copyStrategy.values.persuasion
```

Possible raw values and display labels:

- `reciprocity` -> `Reciprocity`
- `authority` -> `Authority`
- `scarcity` -> `Scarcity`
- `liking` -> `Liking`
- `commitment` -> `Commitment`
- `none` -> hidden

Design:

- Gray badge.

Example:

```txt
Persuasion: Reciprocity
```

### Specificity

Snapshot key:

```ts
specificity
```

Source:

```ts
levers.copyStrategy.values.specificity
```

Possible raw values and display labels:

- `hard_numbers` -> `Hard numbers`
- `vague` -> `Vague`

Design:

- Gray badge.

Example:

```txt
Specificity: Hard numbers
```

### Personalization

Snapshot key:

```ts
personalization
```

Source:

```ts
levers.copyStrategy.values.personalizationDepth
```

Possible raw values and display labels:

- `generic` -> `Generic`
- `merge_field` -> `Merge field`
- `segment_tailored` -> `Segment tailored`
- `one_to_one_researched` -> `1:1 researched`

Design:

- Gray badge.

Example:

```txt
Personalization: Segment tailored
```

## 2. Writing Style

Section label:

```txt
WRITING STYLE
```

Fields:

- `Author` primary badge.

### Author

Snapshot key:

```ts
writingStyle
```

Source:

```ts
STYLE_AUTHOR_LABELS[styleKey]
```

Author descriptions live beside author labels:

```ts
STYLE_AUTHOR_DESCRIPTIONS[styleKey]
```

Resolving a style now returns all author metadata:

```ts
resolveStyle(styleKey)
// {
//   key: StyleKey,
//   text: string,
//   author: string,
//   description: string,
// }
```

The Style modal currently displays the `author` value as the badge value. The `description` value is now available for richer UI, such as a tooltip, author detail panel, or expanded explanation below the `WRITING STYLE` section.

Possible internal style keys and displayed author labels:

- `kennedy` -> `Dan Kennedy`
- `ogilvy` -> `David Ogilvy`
- `kern` -> `Frank Kern`
- `chaperon` -> `Andre Chaperon`
- `halbert` -> `Gary Halbert`
- `schwartz` -> `Eugene Schwartz`
- `albuquerque` -> `Evaldo Albuquerque`
- `makepeace` -> `Clayton Makepeace`
- `brunson` -> `Russell Brunson`
- `bencivenga` -> `Gary Bencivenga`
- `carlton` -> `John Carlton`
- `settle` -> `Ben Settle`

Author descriptions:

- `kennedy` -> Dan Kennedy is described as a direct-response marketing strategist known for the "No B.S." series, blunt teaching style, and sequenced follow-up selling.
- `ogilvy` -> David Ogilvy is described as "The Father of Advertising," founder of Ogilvy & Mather, and a research-driven, benefit-focused advertising figure.
- `kern` -> Frank Kern is described as an internet marketer associated with product-launch email sequences and casual direct-response email.
- `chaperon` -> Andre Chaperon is described as a pioneer of narrative-driven soap opera autoresponder sequences.
- `halbert` -> Gary Halbert is described as a legendary direct-mail copywriter known for high-converting sales letters and The Boron Letters.
- `schwartz` -> Eugene Schwartz is described as the author of Breakthrough Advertising and a key figure behind market sophistication and awareness strategy.
- `albuquerque` -> Evaldo Albuquerque is described as an Agora Financial email copywriter known for storytelling in financial promotions.
- `makepeace` -> Clayton Makepeace is described as a major direct-response copywriter in health and financial newsletter promotions.
- `brunson` -> Russell Brunson is described as ClickFunnels co-founder and a funnel/story/offer marketing teacher.
- `bencivenga` -> Gary Bencivenga is described as a proof-heavy, credibility-first copywriter often called "the copywriter's copywriter."
- `carlton` -> John Carlton is described as a gritty, punchy, no-fluff direct-response copywriter.
- `settle` -> Ben Settle is described as a daily, personality-driven email marketing specialist.

Script adapter:

```ts
scripts/writing-styles.ts
```

This file re-exports the shared writing-style data for scripts and exposes:

```ts
resolveStyleFromFlag(flag)
```

That helper:

- Accepts a CLI flag string.
- Lowercases it into a `StyleKey`.
- Validates that the key exists in `WRITING_STYLES`.
- Prints valid style keys and exits if the flag is invalid.
- Returns `{ key, text }` for script generation flows.

Displayed label:

- The modal receives the author name, not the key.
- If `writingStyle` is null, the whole Writing Style section disappears.
- The author description exists in shared data but is not displayed by the current badge-only modal.

Design:

- Primary badge.
- Brand color.

Example:

```txt
Author: Frank Kern
```

## 3. Subject Line

Section label:

```txt
SUBJECT LINE
```

Fields:

- `Type`
- `Length`
- `Casing`

The source `SubjectLineValues` also includes:

- `personalizationToken`
- `urgency`
- `numberIncluded`
- `emoji`

But those four values are **not displayed in this modal today** because they are not included in `VARIABLE_SECTIONS`.

### Type

Snapshot key:

```ts
subjectType
```

Source:

```ts
levers.subjectLine.values.type
```

Possible raw values:

- `question`
- `statement`
- `curiosity_gap`
- `list`
- `announcement`

Displayed labels:

- No special label map exists for `subjectType`.
- Values fall back to underscore replacement.

Therefore:

- `question` -> `question`
- `statement` -> `statement`
- `curiosity_gap` -> `curiosity gap`
- `list` -> `list`
- `announcement` -> `announcement`

Design:

- Gray badge.

Example:

```txt
Type: curiosity gap
```

### Length

Snapshot key:

```ts
subjectLength
```

Possible raw/display values:

- `short`
- `medium`
- `long`

No special label map exists for `subjectLength`, so they display lowercase as stored.

Example:

```txt
Length: medium
```

### Casing

Snapshot key:

```ts
subjectCasing
```

Possible raw/display values:

- `sentence`
- `title`
- `lowercase`

No special label map exists for `subjectCasing`, so they display lowercase as stored.

Example:

```txt
Casing: sentence
```

## 4. Preheader

Section label:

```txt
PREHEADER
```

Fields:

- One pseudo-field named `Preheader`.

### Preheader

Snapshot keys:

```ts
preheaderPresent
preheaderLength
preheaderRelationship
```

Possible raw values:

`preheaderPresent`:

- `true`
- `false`

`preheaderLength`:

- `short`
- `medium`

`preheaderRelationship`:

- `complements`
- `repeats`

Display rule:

- If `preheaderPresent` is `false`, hide the entire section.
- If `preheaderPresent` is `true`, show:

```txt
Preheader: <preheaderLength>, <preheaderRelationship>
```

Examples:

```txt
Preheader: short, complements
Preheader: medium, repeats
```

Important display detail:

- This pseudo-field does not call `formatVariableValue`.
- It displays raw lowercase values.

## 5. Body

Section label:

```txt
BODY
```

Fields:

- `Length`
- `Links`
- `Scannable`

The source `BodyValues` also includes:

- `format`
- `readingLevel`

Those values are **not displayed in this modal today** because they are not included in `VARIABLE_SECTIONS`.

### Length

Snapshot key:

```ts
bodyLength
```

Possible raw values and display labels:

- `short` -> `Short`
- `medium` -> `Medium`
- `long` -> `Long`

Design:

- Gray badge.

Example:

```txt
Length: Medium
```

### Links

Snapshot key:

```ts
bodyLinks
```

Possible raw values:

- `zero`
- `one`
- `two_plus`

Displayed labels:

- No special label map exists for `bodyLinks`.
- The modal replaces underscores with spaces.

Therefore:

- `zero` -> `zero`
- `one` -> `one`
- `two_plus` -> `two plus`

Example:

```txt
Links: one
```

### Scannable

Snapshot key:

```ts
bodyScannable
```

Possible raw values:

- `true`
- `false`

Displayed labels:

- `true` -> `Yes`
- `false` -> `No`

Example:

```txt
Scannable: Yes
```

## 6. Social Proof

Section label:

```txt
SOCIAL PROOF
```

Fields:

- `Type`
- `Placement`
- `Specificity`

### Type

Snapshot key:

```ts
socialProofType
```

Possible raw values and display labels:

- `none` -> hidden
- `volume` -> `Volume`
- `name_drop` -> `Name drop`
- `peer` -> `Peer`
- `result` -> `Result`
- `quote` -> `Quote`
- `recency` -> `Recency`
- `consensus` -> `Consensus`

Example:

```txt
Type: Result
```

### Placement

Snapshot key:

```ts
socialProofPlacement
```

Possible raw values:

- `opener`
- `body`
- `pre_cta`
- `ps`

Displayed labels:

- No custom label map exists for `socialProofPlacement`.
- Underscores are replaced with spaces.

Therefore:

- `opener` -> `opener`
- `body` -> `body`
- `pre_cta` -> `pre cta`
- `ps` -> `ps`

If `socialProofType` is `none`, this value is usually `null` and hidden.

Example:

```txt
Placement: pre cta
```

### Specificity

Snapshot key:

```ts
socialProofSpecificity
```

Possible raw/display values:

- `vague`
- `specific`

Important:

- The custom specificity label map only applies to the `specificity` field, not `socialProofSpecificity`.
- Therefore social proof specificity is displayed as raw lowercase text.

Examples:

```txt
Specificity: specific
Specificity: vague
```

## 7. CTA

Section label:

```txt
CTA
```

Fields:

- `Type`
- `Style`
- `Placement`
- `Copy`

The source `CtaValues` also includes:

- `count`

`count` is **not displayed in this modal today** because it is not included in `VARIABLE_SECTIONS`.

### Type

Snapshot key:

```ts
ctaType
```

Possible raw values and display labels:

- `reply` -> `Soft ask`
- `book` -> `Book`
- `buy` -> `Buy`
- `read` -> `Read`
- `download` -> `Download`

Design:

- Primary badge.
- Brand color.

Examples:

```txt
Type: Soft ask
Type: Book
```

### Style

Snapshot key:

```ts
ctaStyle
```

Possible raw values:

- `button`
- `link`
- `plain_reply_ask`

Displayed labels:

- No custom label map exists for `ctaStyle`.
- Underscores are replaced with spaces.

Therefore:

- `button` -> `button`
- `link` -> `link`
- `plain_reply_ask` -> `plain reply ask`

Example:

```txt
Style: plain reply ask
```

### Placement

Snapshot key:

```ts
ctaPlacement
```

Possible raw/display values:

- `inline`
- `end`
- `both`

No special label map exists for `ctaPlacement`.

Example:

```txt
Placement: end
```

### Copy

Snapshot key:

```ts
ctaCopy
```

Possible value:

- Any string generated or stored as CTA copy.

Hidden when:

- The string is empty.
- The string is null/undefined after mapping.

Example:

```txt
Copy: Open to a quick call next week?
```

## 8. Offer

Section label:

```txt
OFFER
```

Fields:

- One pseudo-field named `Offer`.

### Offer

Snapshot keys:

```ts
hasOffer
offerType
offerMagnitude
```

Possible raw values:

`hasOffer`:

- `true`
- `false`

`offerType`:

- `percent_off`
- `dollar_off`
- `free_trial`
- `bonus`
- `bundle`
- `guarantee`

`offerMagnitude`:

- Any string, such as `15%`, `$20`, `14 days`, `2-for-1`.

Display rule:

- If `hasOffer` is `false`, hide the entire Offer section.
- If `hasOffer` is `true`, show:

```txt
Offer: <offerType> <offerMagnitude>
```

Examples:

```txt
Offer: percent_off 15%
Offer: dollar_off $20
Offer: free_trial 14 days
Offer: bonus onboarding audit
Offer: bundle 2-for-1
Offer: guarantee 30 days
```

Important display detail:

- This pseudo-field does not use a custom display map.
- `percent_off` stays `percent_off`.
- `free_trial` stays `free_trial`.

## Values That Exist But Are Not Displayed

Some lever values exist in the generation schema but are not shown in the Style modal.

### Sender

The generator tracks:

- `sender.nameType`
- `sender.replyToSet`

Possible values:

- `nameType`: `personal`, `company`, `hybrid`
- `replyToSet`: boolean

The Style modal does not include a Sender section today.

### Subject Line Extra Booleans

The generator tracks:

- `personalizationToken`
- `urgency`
- `numberIncluded`
- `emoji`

The Style modal does not show these today.

### Body Extra Values

The generator tracks:

- `format`: `plain`, `html`
- `readingLevel`: `simple`, `moderate`, `advanced`

The Style modal does not show these today.

### CTA Count

The generator tracks:

- `count`: `one`, `two`

The Style modal does not show this today.

### Offer Scarcity

The generator tracks:

- `scarcity`: `none`, `time_limited`, `quantity_limited`

The Style modal does not show this today.

## Defaults

The generator has conservative defaults in `DEFAULT_LEVER_SUGGESTION`.

If AI output is missing or invalid, `normalizeLeverSuggestion` falls back to these defaults.

Default values:

- Intent: `get_reply`
- Subject length: `short`
- Subject type: `question`
- Subject casing: `sentence`
- Preheader present: `true`
- Preheader length: `medium`
- Preheader relationship: `complements`
- Sender name type: `personal`
- Reply-to set: `true`
- Body length: `medium`
- Body format: `plain`
- Body links: `one`
- Body reading level: `simple`
- Body scannable: `false`
- Framework: `PAS`
- Persuasion: `none`
- Emotion: `curiosity`
- Specificity: `vague`
- Personalization depth: `merge_field`
- Social proof type: `none`
- Social proof placement: `body`
- Social proof specificity: `vague`
- CTA count: `one`
- CTA type: `reply`
- CTA placement: `end`
- CTA style: `plain_reply_ask`
- CTA copy: `Would you be open to a quick reply?`
- Offer present: `false`
- Offer type default: `free_trial`
- Offer magnitude default: empty string
- Offer scarcity default: `none`

Not all defaults become visible. For example:

- `persuasion: none` is hidden.
- `socialProofType: none` is hidden.
- `hasOffer: false` hides the Offer section.

## Example Snapshot

Example input:

```ts
const snapshot: EmailVariableSnapshot = {
  intent: 'click_to_page',
  framework: 'BAB',
  emotion: 'curiosity',
  persuasion: 'reciprocity',
  specificity: 'hard_numbers',
  personalization: 'segment_tailored',
  writingStyle: 'Frank Kern',
  subjectType: 'question',
  subjectLength: 'medium',
  subjectCasing: 'sentence',
  preheaderPresent: false,
  preheaderLength: null,
  preheaderRelationship: null,
  bodyLength: 'short',
  bodyLinks: 'one',
  bodyScannable: true,
  socialProofType: 'consensus',
  socialProofPlacement: 'opener',
  socialProofSpecificity: 'specific',
  ctaType: 'read',
  ctaStyle: 'link',
  ctaPlacement: 'inline',
  ctaCopy: 'Should I send the benchmark sheet?',
  hasOffer: false,
  offerType: null,
  offerMagnitude: null,
}
```

Visible modal output:

```txt
COPY STRATEGY
Intent: Click to Page
Framework: BAB
Emotion: Curiosity
Persuasion: Reciprocity
Specificity: Hard numbers
Personalization: Segment tailored

WRITING STYLE
Author: Frank Kern

SUBJECT LINE
Type: question
Length: medium
Casing: sentence

BODY
Length: Short
Links: one
Scannable: Yes

SOCIAL PROOF
Type: Consensus
Placement: opener
Specificity: specific

CTA
Type: Read
Style: link
Placement: inline
Copy: Should I send the benchmark sheet?
```

Hidden output:

- `PREHEADER`, because `preheaderPresent` is false.
- `OFFER`, because `hasOffer` is false.

## Design Rationale

The modal is designed as a compact metadata inspector:

- It avoids table layouts because variable labels and values can wrap.
- Badges make scanning easier than paragraphs.
- Brand badges draw attention to primary strategy choices.
- Gray badges keep secondary details visible without overpowering the modal.
- Section headings create a clear taxonomy.
- The scrollable body lets the modal stay visually anchored even when many sections are visible.
- The modal width is wide enough to avoid cramped badge wrapping but narrow enough to feel like an inspector, not a full page.

## Implementation Contract

When adding a new visible variable:

1. Add it to `EmailVariableSnapshot`.
2. Ensure it is populated by `fromLeverSuggestion` and/or `fromGeneratedEmailRow`.
3. Add a field to `VARIABLE_SECTIONS`.
4. Add a label map in `formatVariableValue` if raw values should not display as lowercase/underscore-replaced strings.
5. Mark it `primary: true` only if it should appear as a brand badge.
6. Decide whether `none`, empty string, or null should hide it.
7. Add or update the matching field in `EMAIL_VARIABLE_GLOSSARY`.
8. Set `shownInStyleModal: true` in the glossary if the field appears in this modal.
9. Set `modalKey` to the matching `EmailVariableSnapshot` / `VariableSectionKey`.
10. Add `values` meanings for every enum value, or `freeForm` if the field accepts arbitrary text.

When adding a whole new section:

1. Add a new section object to `VARIABLE_SECTIONS`.
2. Give it a stable `id`.
3. Give it a human-readable `label`.
4. Add one or more fields.
5. Rely on `getVisibleVariableSections` to hide the whole section if none of its fields are displayable.
6. Add the same conceptual section to `EMAIL_VARIABLE_GLOSSARY` if it introduces a new category of fields.

When adding or changing a writing style:

1. Add or update the style prompt in `WRITING_STYLES`.
2. Add or update the author label in `STYLE_AUTHOR_LABELS`.
3. Add or update the author background in `STYLE_AUTHOR_DESCRIPTIONS`.
4. Ensure `resolveStyle(key)` still returns `{ key, text, author, description }`.
5. Ensure script flows that import from `scripts/writing-styles.ts` still resolve the style key.
6. Add or update the author entry in `EMAIL_VARIABLE_GLOSSARY` so explanatory UI can describe the author style.

## Current Known Display Quirks

These are intentional consequences of the current code, but they are worth knowing:

- `subjectType`, `subjectLength`, and `subjectCasing` are not title-cased.
- `bodyLinks` displays `zero`, `one`, or `two plus`, not `0`, `1`, or `2+`.
- `ctaStyle` displays `plain reply ask`, not `Plain Ask`.
- `ctaPlacement` displays `inline`, `end`, or `both` in lowercase.
- `socialProofPlacement` displays `pre cta`, not `Before CTA`.
- `socialProofSpecificity` displays `specific` or `vague` in lowercase.
- `preheader` displays raw `short, complements` style text.
- `offer` displays raw `percent_off 15%` style text.
- Sender values exist in the schema but are not shown in this modal.
- Some subject/body/CTA/offer fields exist in the schema but are not shown.
- `EMAIL_VARIABLE_GLOSSARY` contains richer field/value meanings than the current modal displays.
- `STYLE_AUTHOR_DESCRIPTIONS` contains author background descriptions, but the current modal only displays the author badge.

If the design goal is more polished display labels, add explicit label maps for those keys in `formatVariableValue`, or special-case the preheader and offer pseudo-fields.

If the design goal is explanatory UI, use `EMAIL_VARIABLE_GLOSSARY` and `STYLE_AUTHOR_DESCRIPTIONS` as the source of truth for tooltip, drawer, or expanded-description content rather than hardcoding explanations in the React component.

