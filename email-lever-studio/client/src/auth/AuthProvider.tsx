import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyAccountOverrides,
  BUILTIN_ACCOUNTS,
  DEFAULT_ACCOUNT_ID,
  loadAccountOverrides,
  loadCustomAccounts,
  loadSession,
  saveAccountOverrides,
  saveCustomAccounts,
  saveSession,
  type AccountOverrides,
} from './mockAccounts'
import type { AppAccount, LoginInput, SignupInput } from './types'
import type { ConnectedEmailSettings } from '../dashboard/types'
import { createCompany } from '../dashboard/customWorkspace'
import { getAllCompanies } from '../dashboard/mock'

export type AuthContextValue = {
  isAuthenticated: boolean
  activeAccount: AppAccount | null
  accounts: AppAccount[]
  login: (input: LoginInput) =>
    | { ok: true; accountId: string; account: AppAccount }
    | { ok: false; error: string }
  signup: (input: SignupInput) =>
    | { ok: true; accountId: string; account: AppAccount }
    | { ok: false; error: string }
  logout: () => void
  switchAccount: (accountId: string) => void
  updateConnectedEmail: (settings: ConnectedEmailSettings) => void
  addCompany: (name: string) =>
    | { ok: true; companyId: string }
    | { ok: false; error: string }
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function slugifyId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findAccountByEmail(
  accounts: AppAccount[],
  email: string,
): AppAccount | undefined {
  const normalized = email.trim().toLowerCase()
  return accounts.find((a) => a.email.toLowerCase() === normalized)
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

type Props = {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [customAccounts, setCustomAccounts] = useState<AppAccount[]>(() =>
    loadCustomAccounts(),
  )
  const [overrides, setOverrides] = useState<AccountOverrides>(() =>
    loadAccountOverrides(),
  )
  const [session, setSession] = useState<{ accountId: string } | null>(() =>
    loadSession(),
  )

  const accounts = useMemo(
    () =>
      applyAccountOverrides(
        [...BUILTIN_ACCOUNTS, ...customAccounts],
        overrides,
      ),
    [customAccounts, overrides],
  )

  const activeAccount = useMemo(() => {
    if (!session) return null
    return (
      accounts.find((a) => a.id === session.accountId) ??
      accounts.find((a) => a.id === DEFAULT_ACCOUNT_ID) ??
      null
    )
  }, [accounts, session])

  const persistSession = useCallback((next: { accountId: string } | null) => {
    setSession(next)
    saveSession(next)
  }, [])

  const login = useCallback(
    (input: LoginInput):
      | { ok: true; accountId: string; account: AppAccount }
      | { ok: false; error: string } => {
      if (!input.email.trim() || !input.password.trim()) {
        return { ok: false, error: 'Email and password are required.' }
      }
      const account = findAccountByEmail(accounts, input.email)
      if (!account) {
        return { ok: false, error: 'No account found for that email.' }
      }
      persistSession({ accountId: account.id })
      return { ok: true, accountId: account.id, account }
    },
    [accounts, persistSession],
  )

  const signup = useCallback(
    (input: SignupInput):
      | { ok: true; accountId: string; account: AppAccount }
      | { ok: false; error: string } => {
      if (!input.name.trim() || !input.email.trim() || !input.password.trim()) {
        return { ok: false, error: 'Name, email, and password are required.' }
      }
      if (findAccountByEmail(accounts, input.email)) {
        return { ok: false, error: 'An account with this email already exists.' }
      }
      if (
        accounts.some(
          (account) => normalizeName(account.name) === normalizeName(input.name),
        )
      ) {
        return { ok: false, error: 'An account with this name already exists.' }
      }

      const id = `custom-${slugifyId(input.email)}-${Date.now()}`
      const newAccount: AppAccount = {
        id,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        avatar: null,
        companyIds: ['co-coca'],
        defaultCompanyId: 'co-coca',
        connectedEmail: { connected: false, email: null },
      }

      const nextCustom = [...customAccounts, newAccount]
      setCustomAccounts(nextCustom)
      saveCustomAccounts(nextCustom)
      persistSession({ accountId: id })
      return { ok: true, accountId: id, account: newAccount }
    },
    [accounts, customAccounts, persistSession],
  )

  const logout = useCallback(() => {
    persistSession(null)
  }, [persistSession])

  const switchAccount = useCallback(
    (accountId: string) => {
      if (!accounts.some((a) => a.id === accountId)) return
      persistSession({ accountId })
    },
    [accounts, persistSession],
  )

  const updateConnectedEmail = useCallback(
    (settings: ConnectedEmailSettings) => {
      if (!activeAccount) return
      const nextOverrides: AccountOverrides = {
        ...overrides,
        [activeAccount.id]: {
          ...overrides[activeAccount.id],
          connectedEmail: settings,
        },
      }
      setOverrides(nextOverrides)
      saveAccountOverrides(nextOverrides)
    },
    [activeAccount, overrides],
  )

  const addCompany = useCallback(
    (name: string):
      | { ok: true; companyId: string }
      | { ok: false; error: string } => {
      if (!activeAccount) {
        return { ok: false, error: 'You must be signed in to add a company.' }
      }
      const trimmed = name.trim()
      if (!trimmed) {
        return { ok: false, error: 'Company name is required.' }
      }
      if (
        getAllCompanies().some(
          (company) => normalizeName(company.name) === normalizeName(trimmed),
        )
      ) {
        return { ok: false, error: 'A company with this name already exists.' }
      }

      const company = createCompany(trimmed)
      const existingAdded = overrides[activeAccount.id]?.addedCompanyIds ?? []
      const nextOverrides: AccountOverrides = {
        ...overrides,
        [activeAccount.id]: {
          ...overrides[activeAccount.id],
          addedCompanyIds: [...existingAdded, company.id],
        },
      }
      setOverrides(nextOverrides)
      saveAccountOverrides(nextOverrides)

      return { ok: true, companyId: company.id }
    },
    [activeAccount, overrides],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: activeAccount != null,
      activeAccount,
      accounts,
      login,
      signup,
      logout,
      switchAccount,
      updateConnectedEmail,
      addCompany,
    }),
    [
      activeAccount,
      accounts,
      login,
      signup,
      logout,
      switchAccount,
      updateConnectedEmail,
      addCompany,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
