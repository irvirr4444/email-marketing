# Mock auth and account switching

Mock-first login, signup, and multi-account switching for the dashboard. No real backend yet — sessions persist in `localStorage` so the flow feels real and can be swapped for real auth later.

## Flow

1. Unauthenticated users hitting `/dashboard/*` redirect to `/login`.
2. Login or signup creates a mock session (`accountId` in localStorage).
3. User lands on their account's default campaign.
4. Header account menu shows the active account and lets you switch accounts or sign out.
5. Switching accounts updates companies, campaigns, connected email settings, and header identity.

## Demo accounts

| Email | Companies | Connected email |
|-------|-----------|-----------------|
| `caitlyn@untitledui.com` | Coca-Cola | `outreach@cocacola.com` |
| `sienna@untitledui.com` | Pepsi, Red Bull | `sienna@pepsico.com` |

Any non-empty password works for built-in accounts.

## Module layout

```
auth/
├── README.md
├── types.ts              ← AppAccount, AuthSession, LoginInput, SignupInput
├── mockAccounts.ts       ← built-in accounts + localStorage helpers
├── AuthProvider.tsx      ← session state, login/signup/logout/switch
├── useAuth.ts            ← context hook
├── ProtectedRoute.tsx    ← route guard
└── DashboardDefaultRedirect.tsx
```

## localStorage keys

| Key | Purpose |
|-----|---------|
| `sigil-auth-session` | Active `{ accountId }` |
| `sigil-auth-custom-accounts` | User-created accounts from signup |
| `sigil-auth-account-overrides` | Per-account connected email overrides |

## Integration points

- **`AppRouter.tsx`** — wraps app in `AuthProvider`; `/login` + protected `/dashboard` routes.
- **`pages/LoginPage.tsx`** — login/signup UI (Untitled UI).
- **`dashboard/components/DashboardHeaderAccount.tsx`** — account trigger + popover menu.
- **`dashboard/components/DashboardAccountMenu.tsx`** — switch account, add account, sign out, theme toggle.
- **`dashboard/DashboardPage.tsx`** — scopes companies/campaigns by `activeAccount.companyIds`.
- **`dashboard/drawers/SettingsDrawer.tsx`** — connected email from `useAuth().updateConnectedEmail`.
- **`dashboard/mock.ts`** — `getCompaniesForAccount`, `getDefaultCampaignForAccount`, `isCampaignAccessible`.

## Usage

```tsx
import { useAuth } from '../auth/useAuth'

const { activeAccount, switchAccount, logout } = useAuth()
```

Components should read account context from `useAuth()` rather than hardcoded mock data.

## Future backend

Designed toward `users`, `accounts`/`workspaces`, `account_memberships`, and `connected_email_accounts`. Replace `AuthProvider` internals without rewriting dashboard components.
