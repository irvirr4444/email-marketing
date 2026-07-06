# Email card implementation

This document explains how the campaign dashboard email card is built and which files are part of that feature. It is written for future agents working on the card, especially Claude, so changes stay consistent with the current architecture and Untitled UI rules.

## Entry point

`components/EmailCard.tsx` is the main component. It renders one `CampaignEmail` and owns the card-local UI state:

- Display status (`sent`, `pending`, or local-only `rejected`)
- Edit mode
- Draft subject / preheader / body while editing
- Approve, reject, and style modal open states
- Save/loading state
- Snackbar messages

The card is mounted in `DashboardPage.tsx`:

```tsx
<EmailCard
  key={email.id}
  email={email}
  onEmailUpdated={handleEmailUpdated}
/>
```

`handleEmailUpdated()` replaces the updated email in the page-local `emails` state. Filtering and activity stats then recompute from that array.

## Data contract

The card receives a `CampaignEmail` from `types.ts`.

Important fields:

| Field | Used for |
|------|----------|
| `id` | PATCH route and React identity |
| `campaignId` | Parent campaign association |
| `subject` | Header title or editable subject input |
| `preheader` | Optional preview section or editable input |
| `body` | Main email body or editable textarea |
| `recipients` | Recipient chips for sent emails and reject review |
| `recipientContext` | Currently shown in `RejectEmailDialog` only |
| `sentAt` | Sent date/time display |
| `createdAt` | Sorting pending emails elsewhere; not rendered in the card |
| `status` | Server status: `sent` or `pending` |
| `metrics` | Engagement badges |
| `variables` | Style badge visibility and style modal content |

The card adds a local `DisplayStatus` type:

```ts
type DisplayStatus = CampaignEmail['status'] | 'rejected'
```

`rejected` is local UI state only. It is not currently persisted through an API call.

## Visual structure

The card is an `<article>` with a token-based surface:

- Normal: `rounded-2xl bg-primary shadow-md ring-1 ring-secondary_alt`
- Editing: `rounded-2xl bg-primary shadow-md ring-2 ring-brand/30 ring-secondary_alt`

The layout has two main regions:

1. Header
   - Timestamp/status helper text on the left
   - Style badge and status badge on the right
   - Subject title or subject input
   - Recipients row for non-pending emails only
2. Body
   - Preheader section or preheader input
   - Body section or textarea
   - Engagement badges
   - Pending-only action row

All styling uses dashboard semantic tokens (`bg-primary`, `text-tertiary`, `ring-secondary_alt`, etc.). Do not replace Untitled UI controls with raw buttons/inputs unless there is no appropriate Untitled UI primitive.

## Status behavior

The card has three display states:

| Display status | Source | UI |
|---------------|--------|----|
| `pending` | `email.status` | “Awaiting approval”, orange Pending badge, edit/reject/approve actions |
| `sent` | `email.status` or approve action | Sent date/time when `sentAt` exists, green Sent badge, no pending action row |
| `rejected` | Local `handleReject()` only | “Rejected”, red Rejected badge, no pending action row |

`EmailCardTimestamp` handles the left-side timestamp text:

- Pending → `Awaiting approval`
- Rejected → `Rejected`
- Sent with `sentAt` → `YYYY-MM-DD` and `HH:mm`
- Sent without `sentAt` → renders nothing

## Pending card actions

Pending cards show actions only when not editing:

| Button | Action |
|--------|--------|
| `Edit` | Enters local edit mode |
| `Reject` | Opens `RejectEmailDialog` |
| `Approve` | Opens `ApproveEmailDialog` |

Pending cards show save actions only while editing:

| Button | Action |
|--------|--------|
| `Cancel` | Resets the draft from `email` and exits edit mode |
| `Save changes` | Validates and PATCHes subject/preheader/body |

Sent and rejected cards do not show the pending action row.

## Editing behavior

`toDraft(email)` creates the editable draft:

```ts
{
  subject: email.subject,
  preheader: email.preheader ?? '',
  body: email.body,
}
```

Editing fields:

- Subject: Untitled UI `Input`, required
- Preheader: Untitled UI `Input`, optional
- Body: Untitled UI `TextArea`, required

Save validation:

- `subject.trim()` must be non-empty
- `body.trim()` must be non-empty
- `preheader.trim()` becomes `null` if empty

Save flow:

1. Build a patch: `{ subject, preheader, body }`
2. Call `patchEmail(email.id, patch)` from `api.ts`
3. Call `onEmailUpdated(updated)`
4. Exit edit mode
5. Show a brand snackbar

Current fallback behavior: if `patchEmail()` throws, the card still creates a local updated email (`{ ...email, ...patch }`), calls `onEmailUpdated()`, exits edit mode, and shows success. This keeps mock/offline UX smooth, but future persistence work may want to surface a real error in non-mock mode.

## Approve dialog

File: `components/ApproveEmailDialog.tsx`

Opened by the pending card `Approve` button.

Content:

- Header: inline `Send01` icon and “Confirm send”
- Number input: “How many emails should we generate?”
- Subject review
- Optional preheader review
- Body review
- Footer buttons: Cancel, Confirm & send

Behavior:

- `generateCount` resets to `1` whenever the dialog opens
- Input is clamped from `1` to `50`
- `handleConfirm()` calls `onConfirm()` then closes the dialog
- In `EmailCard`, `onConfirm` is `handleApprove()`, which sets local display status to `sent` and shows a snackbar

Important limitation: `generateCount` is UI state only right now. It is not passed to `onConfirm`, the API, or email generation.

## Reject dialog

File: `components/RejectEmailDialog.tsx`

Opened by the pending card `Reject` button.

Content:

- Header: `FeaturedIcon` with `XCircle`, title, helper text
- Recipients review using `EmailRecipients`
- Optional recipient context badges
- Subject review
- Optional preheader review
- Body review
- Footer buttons: Cancel, Confirm rejection

Behavior:

- `handleConfirm()` calls `onConfirm()` then closes the dialog
- In `EmailCard`, `onConfirm` is `handleReject()`, which sets local display status to `rejected` and shows an error snackbar

Important limitation: rejection is local display state only. No reject API call exists in the current card flow.

## Style badge and modal

Files:

- `components/EmailVariablesDialog.tsx`
- `components/EmailVariables.tsx`
- `components/StyleStarsIcon.tsx`
- Shared helper: `getVisibleVariableSections()` from `@shared/email-variables.ts`

`EmailCard` computes:

```ts
const hasVariables = getVisibleVariableSections(email.variables).length > 0
```

When `hasVariables` is true:

- A clickable brand `BadgeWithIcon` labeled `Style` appears beside the status badge
- The badge uses `StyleStarsIcon`
- Clicking it opens `EmailVariablesDialog`

`EmailVariablesDialog` is a small modal with:

- Inline stars icon
- Title: `Style`
- `EmailVariables` content

`EmailVariables` renders visible variable sections as badge groups. Primary variables use brand badges; other variables use gray badges.

## Recipients

File: `components/EmailRecipients.tsx`

Card behavior:

- Pending cards do not show recipients in the card header
- Non-pending cards show recipients after the subject
- `EmailCard` passes `onChange` to persist recipient changes via `patchEmail(email.id, { recipients })`

Component behavior:

- Non-editable mode returns `null` when there are no recipients
- Read mode displays a `To` label and Untitled UI `Tag` chips
- Editable mode exists in the component but is not currently enabled by `EmailCard`
- Editable mode supports adding with Enter/comma/blur and removing with chip close/backspace

Note: `EmailRecipients` uses a raw `<input>` in editable mode. That is contained inside a custom tag-input composition. Keep this only if no Untitled UI tag-input primitive fits better.

## Engagement badges

File: `components/EmailEngagementBadges.tsx`

Rendered by `EmailCard` for sent display:

```tsx
<EmailEngagementBadges
  metrics={email.metrics}
  status={displayStatus === 'sent' ? 'sent' : email.status}
  onSignalClick={(signal) => setEngagementSignal(signal)}
/>
```

`EmailEngagementBadges` returns `null` unless `status === 'sent'`.

When `onSignalClick` is provided, all four badges (`Delivered`, `Opened`, `Clicked`, `Replied`) are clickable and open `EmailEngagementModal` with the matching tab active.

It derives percentages through the engagement module:

- `ENGAGEMENT_KEYS`
- `ENGAGEMENT_LABELS`
- `engagementPercentages(metrics, status)`

It renders four badges:

- Delivered %
- Opened %
- Clicked %
- Replied %

Badge color:

- `success` when percentage is greater than `0`
- `gray` when percentage is `0`

## Engagement drill-down modal

Files:

- `components/EmailEngagementModal.tsx`
- `components/RecipientEngagementList.tsx`
- `components/EmailThreadPanel.tsx`
- `engagement/recipientActivity.ts`

Flow:

1. User clicks a sent-email engagement badge.
2. `EmailCard` sets `engagementSignal` and opens `EmailEngagementModal`.
3. Modal shows tabs: `Delivered`, `Opened`, `Clicked`, `Replied` with recipient counts.
4. Left pane lists recipients for the active tab.
5. Right pane shows empty state until a recipient is selected.
6. After selection: activity chips, thread messages, mock reply composer.

`Delivered` tab includes recipients who received the email but have not opened yet — useful for follow-up / double-text.

Mock limitations:

- Recipient activity and threads come from `recipientActivity.ts` mock data.
- `Send reply` appends a local outbound message only; no real email provider integration.

## API touchpoints

File: `api.ts`

The card currently uses:

```ts
patchEmail(
  emailId: string,
  patch: Partial<Pick<CampaignEmail, 'subject' | 'preheader' | 'body' | 'recipients'>>,
)
```

Route:

```txt
PATCH /api/dashboard/emails/:emailId
```

The API module also has `approveEmail(emailId)`, but `EmailCard` does not currently call it. Approval is local display state only.

## Parent data flow

Files:

- `DashboardPage.tsx`
- `useDashboardData.ts`
- `mock.ts`

Flow:

1. `useDashboardData(campaignId)` loads emails from mock data in dev, or API when configured.
2. `DashboardPage` copies fetched emails into local `emails` state.
3. `DashboardPage` renders filtered emails.
4. Each `EmailCard` receives `onEmailUpdated`.
5. When a card saves edits or recipients, the parent replaces that email in local state.
6. `filterEmails()` and `computeCampaignActivity()` recompute from the updated local array.

Mock/dev behavior:

- `api.ts` uses mock dashboard by default in dev unless `VITE_USE_MOCK_DASHBOARD=false`
- If real fetch fails, `useDashboardData` falls back to mock campaign/email data

## Shared styles

File: `components/statusBadgeStyles.ts`

`STATUS_BADGE_CLASS` keeps status-style badges the same size and shape. Use it for:

- Sent badge
- Pending badge
- Rejected badge
- Style badge
- Engagement badges with additional width classes

Do not invent one-off badge sizing for card badges unless the shared class cannot fit the case.

## Related files

| File | Role |
|------|------|
| `components/EmailCard.tsx` | Main card implementation |
| `components/ApproveEmailDialog.tsx` | Confirm send modal |
| `components/RejectEmailDialog.tsx` | Confirm rejection modal |
| `components/EmailVariablesDialog.tsx` | Style modal shell |
| `components/EmailVariables.tsx` | Variable badge groups |
| `components/StyleStarsIcon.tsx` | Custom stars icon for Style badge/modal |
| `components/EmailRecipients.tsx` | Recipient tag row |
| `components/EmailEngagementBadges.tsx` | Sent-email engagement badges (clickable drill-down entry) |
| `components/EmailEngagementModal.tsx` | Recipient engagement drill-down modal |
| `components/RecipientEngagementList.tsx` | Modal left-pane recipient list |
| `components/EmailThreadPanel.tsx` | Modal thread view + mock reply composer |
| `engagement/recipientActivity.ts` | Mock recipient activity and thread helpers |
| `components/DashboardSnackbar.tsx` | Save/approve/reject feedback |
| `components/statusBadgeStyles.ts` | Shared badge sizing/selection classes |
| `api.ts` | `patchEmail()` and other dashboard API calls |
| `types.ts` | `CampaignEmail`, `EmailRecipient`, `EmailMetrics` |
| `DashboardPage.tsx` | Parent list and local update flow |
| `useDashboardData.ts` | Initial data loading |
| `mock.ts` | Mock emails, filtering, sorting, activity calculations |

## Known gaps / future cleanup

These are intentional notes for future agents:

- Approval does not call `approveEmail()` yet. It only flips local display status.
- Rejection does not call a reject API. It only flips local display status.
- `generateCount` in `ApproveEmailDialog` is not passed anywhere.
- Engagement modal `Send reply` is mock-only; no real inbox/send API.
- `RejectEmailDialog` still shows recipients and recipient context, while `ApproveEmailDialog` no longer does.
- Recipient editing logic exists in `EmailRecipients`, but `EmailCard` does not currently enable editable recipients in the card.
- Save fallback always shows success even when PATCH fails. This is useful for mock/offline behavior but may be misleading when using a real API.

## Implementation rules for future changes

- Keep `EmailCard.tsx` as the orchestrator, but move reusable UI blocks into focused components when they grow.
- Keep date formatting helpers near the card unless multiple dashboard files need them.
- Use Untitled UI components for controls: `Button`, `Input`, `TextArea`, `Badge`, `BadgeWithIcon`, modals.
- Preserve semantic tokens (`bg-primary`, `text-primary`, `text-tertiary`, `ring-secondary_alt`) so light/dark themes keep working.
- Keep pending-specific actions hidden for sent/rejected display states.
- Do not show recipients on pending cards unless the product decision changes.
- Use `STATUS_BADGE_CLASS` for card badges.
- If approval/rejection becomes persistent, wire real API calls before flipping local state, or clearly handle optimistic updates and rollback.

