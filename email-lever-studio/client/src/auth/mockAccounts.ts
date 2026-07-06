import type { AppAccount } from './types'

const avatar = (slug: string) =>
  `https://www.untitledui.com/images/avatars/${slug}?fm=webp&q=80`

/** Built-in demo accounts — always available in mock auth. */
export const BUILTIN_ACCOUNTS: AppAccount[] = [
  {
    id: 'caitlyn',
    name: 'Caitlyn King',
    email: 'caitlyn@untitledui.com',
    avatar: avatar('caitlyn-king'),
    companyIds: ['co-coca'],
    defaultCompanyId: 'co-coca',
    connectedEmail: {
      connected: true,
      email: 'outreach@cocacola.com',
    },
  },
  {
    id: 'sienna',
    name: 'Sienna Hewitt',
    email: 'sienna@untitledui.com',
    avatar:
      'https://www.untitledui.com/images/avatars/transparent/sienna-hewitt?bg=%23E0E0E0',
    companyIds: ['co-pepsi', 'co-redbull'],
    defaultCompanyId: 'co-pepsi',
    connectedEmail: {
      connected: true,
      email: 'sienna@pepsico.com',
    },
  },
]

export const DEFAULT_ACCOUNT_ID = BUILTIN_ACCOUNTS[0].id

const SESSION_KEY = 'sigil-auth-session'
const CUSTOM_ACCOUNTS_KEY = 'sigil-auth-custom-accounts'
const OVERRIDES_KEY = 'sigil-auth-account-overrides'

export type AccountOverrides = Record<
  string,
  {
    connectedEmail?: AppAccount['connectedEmail']
    /** Company ids added by the user for this account. */
    addedCompanyIds?: string[]
  }
>

export function loadSession(): { accountId: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { accountId?: string }
    return parsed.accountId ? { accountId: parsed.accountId } : null
  } catch {
    return null
  }
}

export function saveSession(session: { accountId: string } | null) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function loadCustomAccounts(): AppAccount[] {
  try {
    const raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AppAccount[]
  } catch {
    return []
  }
}

export function saveCustomAccounts(accounts: AppAccount[]) {
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function loadAccountOverrides(): AccountOverrides {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as AccountOverrides
  } catch {
    return {}
  }
}

export function saveAccountOverrides(overrides: AccountOverrides) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
}

export function applyAccountOverrides(
  accounts: AppAccount[],
  overrides: AccountOverrides,
): AppAccount[] {
  return accounts.map((account) => {
    const patch = overrides[account.id]
    if (!patch) return account

    const addedCompanyIds = patch.addedCompanyIds ?? []
    const companyIds =
      addedCompanyIds.length > 0
        ? [
            ...account.companyIds,
            ...addedCompanyIds.filter((id) => !account.companyIds.includes(id)),
          ]
        : account.companyIds

    return {
      ...account,
      companyIds,
      ...(patch.connectedEmail
        ? { connectedEmail: patch.connectedEmail }
        : {}),
    }
  })
}
