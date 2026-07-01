# Add Social Proof — Cursor Implementation Brief

This adds social proof as a first-class feature. Two things are being added simultaneously and must be implemented together: (1) a new **Style card** in the pipeline that controls *how* social proof is deployed in the email, and (2) a new **asset intake block** in the context section where the user tells us *what proof they actually have*. Neither is useful without the other.

Read this whole document before touching any file.

---

## 1. `shared/schema.ts` — data model changes

### 1a. Add `socialProofAssets` to `ColdContext`

Find the `ColdContext` type and add this optional field:

```ts
socialProofAssets?: {
  recognizableCustomer?: string   // name-drop: "Stripe, or a fintech startup like theirs"
  specificResult?: string          // result: "Acme went from 2% to 8% reply rate in 6 weeks"
  customerQuote?: string           // testimonial: "Jordan, Head of Growth at Acme — 'we cut time by 60%'"
  customerCount?: string           // volume: "500 teams", "10,000+ users"
  recentWin?: string               // recency: "just signed a team at Salesforce last week"
}
```

Also update `emptyColdContext()` to include `socialProofAssets: {}`.

### 1b. Add `socialProof` card to `CARD_DEFINITIONS`

Insert this entry. Key order in `CARD_DEFINITIONS` must place `socialProof` after `copyStrategy` and before `cta` — this matches the pipeline row order defined in §3 below.

```ts
socialProof: {
  label: "Social Proof",
  fields: [
    {
      key: "type",
      label: "Type",
      control: "segmented",
      options: [
        { value: "none",      label: "None" },
        { value: "volume",    label: "Volume" },
        { value: "name_drop", label: "Name drop" },
        { value: "peer",      label: "Peer" },
        { value: "result",    label: "Result" },
        { value: "quote",     label: "Quote" },
        { value: "recency",   label: "Recency" },
        { value: "consensus", label: "Consensus" },
      ],
    },
    {
      key: "placement",
      label: "Placement",
      control: "segmented",
      options: [
        { value: "opener",  label: "Opener" },
        { value: "body",    label: "Body" },
        { value: "pre_cta", label: "Before CTA" },
        { value: "ps",      label: "P.S." },
      ],
      hiddenWhen: { field: "type", value: "none" },
    },
    {
      key: "specificity",
      label: "Specificity",
      control: "segmented",
      options: [
        { value: "vague",    label: "Vague" },
        { value: "specific", label: "Specific" },
      ],
      hiddenWhen: { field: "type", value: "none" },
    },
  ],
},
```

### 1c. Add `socialProof` to `LeverSuggestion` type

Add it alongside the other card keys:

```ts
socialProof: {
  type: SocialProofType           // "none" | "volume" | "name_drop" | "peer" | "result" | "quote" | "recency" | "consensus"
  placement: SocialProofPlacement // "opener" | "body" | "pre_cta" | "ps"
  specificity: "vague" | "specific"
  locked: boolean
  reasoning: string
}
```

Define the union types `SocialProofType` and `SocialProofPlacement` at the top of the file alongside the other enums. Do not inline them.

### 1d. Update `DEFAULT_LEVER_SUGGESTION`

Add the default social proof lever:

```ts
socialProof: {
  type: "none",
  placement: "body",
  specificity: "vague",
  locked: false,
  reasoning: "",
}
```

### 1e. Update `mergeWithLocked()`

Make sure `socialProof` is included in the merge logic alongside the other card keys. If `mergeWithLocked` iterates `CARD_DEFINITIONS` keys dynamically, this is automatic — verify. If keys are hardcoded, add `socialProof`.

### 1f. Update the OpenAI JSON schema

The server-side JSON schema sent to OpenAI for `suggest-levers` must include `socialProof` with its three fields as required properties. Mirror the exact pattern used for `copyStrategy` or `offer` — required object, required sub-fields, enum values matching the union types above.

---

## 2. `ContextDetails.tsx` — asset intake block

Add a new subsection at the bottom of `ContextDetails`, below the Notes field. It should be always visible (no expand/collapse — this information is as important as Company or Role).

**Section heading:** `Social proof you can use` in the same style as other subsection headings in this component.

**Subheading** (Roboto 13px, `--on-surface-variant`): `Only fill in what you actually have. If a field is empty, the AI will skip that proof type.`

Five plain-language fields, each a Material outlined text field matching the style of the existing context fields:

| Label | Placeholder | Field in `socialProofAssets` |
|---|---|---|
| A customer they'd recognize | e.g. Stripe, or a fintech startup like theirs | `recognizableCustomer` |
| A specific result you can name | e.g. Acme went from 2% to 8% reply rate in 6 weeks | `specificResult` |
| A real quote from a customer | Name, role, company — what they said | `customerQuote` |
| How many customers or users | e.g. 500 teams, 10,000+ users | `customerCount` |
| Anything recent | e.g. just signed a team at Salesforce last week | `recentWin` |

`customerQuote` should be a multiline textarea (same as Notes). The other four are single-line text inputs.

Wire each field to `context.socialProofAssets` via the existing `onContextChange` prop pattern used elsewhere in this component. The handler in `App.tsx` already handles nested updates via spread — if it doesn't, update it to handle one level of nesting (`socialProofAssets`).

---

## 3. Pipeline layout — new `Proof` row

In `StyleSection.tsx`, add `socialProof` as a new pipeline row between `Persuasion` and `Action`.

The full row order after this change:

```
Inbox       → subjectLine                    (1 col)
Preview     → preheader · sender             (2 col)
Message     → body                           (1 col)
Persuasion  → copyStrategy                   (1 col)
Proof       → socialProof                    (1 col)   ← new
Action      → cta · offer                   (2 col)
```

Apply `.style-row-label` to the `Proof` label exactly as the other row labels are styled. `socialProof` is a `supporting` card variant, 1-col span. Pass `subdued={!leversSuggested}` and `showLock={leversSuggested}` and `showReasoning={leversSuggested}` the same as other supporting cards.

---

## 4. Backend — `generate-draft` prompt changes

In the Express route that builds the prompt for `generate-draft`, find where the lever values are serialized into the prompt and add this block for social proof. Place it in the section that describes persuasion/copy strategy — it belongs there logically.

```
Social proof:
- Type: {levers.socialProof.type}
- Placement: {levers.socialProof.placement}
- Specificity: {levers.socialProof.specificity}

Available proof assets (from sender):
- Recognizable customer: {context.socialProofAssets?.recognizableCustomer || "none provided"}
- Specific result: {context.socialProofAssets?.specificResult || "none provided"}
- Customer quote: {context.socialProofAssets?.customerQuote || "none provided"}
- Customer count: {context.socialProofAssets?.customerCount || "none provided"}
- Recent win: {context.socialProofAssets?.recentWin || "none provided"}

Rules:
- If type is "none": do not include any social proof in the email. Skip this section entirely.
- If specificity is "specific" AND the relevant asset field is "none provided": do not fabricate proof. Omit social proof from the email entirely and do not mention it.
- If specificity is "vague": you may write general proof language ("teams like yours", "many of our customers") without needing a specific asset.
- Place the proof at the "{levers.socialProof.placement}" position in the email structure.
- Match the proof type to the asset: use recognizableCustomer for name_drop, specificResult for result, customerQuote for quote, customerCount for volume, recentWin for recency.
- For "peer" and "consensus" types, use the recognizableCustomer asset if available, otherwise write general peer language.
```

The critical rule is the second one — **never fabricate specific proof**. This is the failure mode the whole feature is designed to prevent.

---

## 5. Backend — `suggest-levers` prompt changes

In the `suggest-levers` prompt, tell the AI to suggest the social proof lever intelligently based on what assets exist. Add this instruction:

```
For the socialProof lever:
- Look at context.socialProofAssets to see what proof the sender has provided.
- If no assets are provided at all, suggest type: "none".
- If a specificResult is provided, prefer type: "result", specificity: "specific".
- If recognizableCustomer is provided, prefer type: "name_drop", specificity: "specific".
- If customerQuote is provided, prefer type: "quote", specificity: "specific".
- If customerCount is provided, prefer type: "volume", specificity: "specific".
- If recentWin is provided, prefer type: "recency", specificity: "specific".
- Suggest placement based on email intent: "opener" for consensus/name_drop, "pre_cta" for result/quote, "ps" for recency.
- Prioritize whichever single asset is most compelling for this recipient — do not suggest using all of them.
```

---

## 6. `StyleField.tsx` — verify `hiddenWhen` works for this card

`placement` and `specificity` both use `hiddenWhen: { field: "type", value: "none" }`. This means: hide these fields when `type === "none"`.

Verify that the existing `hiddenWhen` implementation in `StyleField.tsx` handles this correctly — it should already, since `offer` uses the same pattern (`hiddenWhen: { field: "hasOffer", value: false }`). The only difference is this one compares a string value instead of a boolean. If the comparison is strict (`===`), it will work. If it uses loose equality or a truthy check, you may need to adjust it to support string comparisons.

Per the existing frontend spec, hidden fields stay **visible but disabled** (`.style-field-row-inactive`), not removed from DOM. Confirm this behavior is preserved for the new fields.

---

## 7. Type exports

Make sure `SocialProofType` and `SocialProofPlacement` are exported from `shared/schema.ts` and re-exported through `src/types.ts` alongside the other type exports. Any component that references `levers.socialProof` will need these.

---

## 8. What NOT to change

- `App.tsx` state shape — `levers: LeverSuggestion` already covers this once `LeverSuggestion` is updated in schema. No new top-level state needed.
- `api.ts` — request shapes are unchanged; `socialProofAssets` travels inside `context` (which is already sent in full), and `socialProof` lever travels inside `levers` (also already sent in full).
- `StepRail.tsx` — no new step. Social proof lives inside the existing Style and Recipient steps.
- `AppBar.tsx` — no changes.
- `DraftCard.tsx` — no changes. The draft renders whatever the AI writes; it doesn't need to know proof was used.
- `IntentChips.tsx` — no changes.
- All Material primitive components (`MaterialChip`, `MaterialSwitch`, `LockButton`, etc.) — no changes.

---

## 9. Build order

1. `shared/schema.ts` — all type/schema/default/merge changes first. Nothing else compiles until this is done.
2. Backend prompt changes (`suggest-levers` + `generate-draft`) — do this second so you can test end-to-end as soon as the UI is wired up.
3. `ContextDetails.tsx` — add the asset intake block.
4. `StyleSection.tsx` — add the Proof row.
5. Verify `StyleField.tsx` hiddenWhen string comparison handles `"none"` correctly.
6. Export types through `src/types.ts`.
7. End-to-end test: fill in a specific result asset, set type=result + specificity=specific, generate — confirm the draft uses the exact asset text without inventing anything. Then clear the asset, keep specificity=specific, regenerate — confirm proof is omitted entirely, not hallucinated.