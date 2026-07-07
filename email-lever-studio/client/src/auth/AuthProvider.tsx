import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
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
import { createCompany as mockCreateCompany } from '../dashboard/customWorkspace'
import { getAllCompanies } from '../dashboard/mock'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  clearWorkspaceCache,
  loadWorkspaceData,
  setWorkspaceCache,
} from '../dashboard/dataSource'
import {
  createCompany as sbCreateCompany,
  getAppUser,
  getCurrentSession,
  onAuthStateChange,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updateAppUserSettings,
  type CompanyProfileInput,
} from './supabaseAuth'
import type { AppUserRow } from '../lib/database.types'

export type AuthResult =
  | { ok: true; accountId: string; account: AppAccount }
  | { ok: false; error: string }

export type AuthContextValue = {
  isAuthenticated: boolean
  /** True while the initial Supabase session is being restored. */
  initializing: boolean
  activeAccount: AppAccount | null
  accounts: AppAccount[]
  login: (input: LoginInput) => Promise<AuthResult>
  loginWithGoogle: () => Promise<{ ok: true } | { ok: false; error: string }>
  signup: (input: SignupInput) => Promise<AuthResult>
  logout: () => Promise<void> | void
  switchAccount: (accountId: string) => void
  updateConnectedEmail: (settings: ConnectedEmailSettings) => void
  /** True when a signed-in Supabase user has no company yet (needs onboarding). */
  needsCompanyOnboarding: boolean
  addCompany: (
    name: string,
    profile?: CompanyProfileInput,
  ) => Promise<{ ok: true; companyId: string } | { ok: false; error: string }>
  /** Reload companies/campaigns from the backend (Supabase mode). */
  refreshWorkspace: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const SUPABASE_MODE = isSupabaseConfigured()

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

/** Build the app account view from a Supabase user + profile + companies. */
function buildSupabaseAccount(
  user: User,
  appUser: AppUserRow | null,
  companies: { id: string; name: string }[],
): AppAccount {
  const settings = (appUser?.settings ?? {}) as {
    connectedEmail?: ConnectedEmailSettings
  }
  const metaName = (user.user_metadata?.name ?? user.user_metadata?.full_name) as
    | string
    | undefined
  return {
    id: user.id,
    name: appUser?.name ?? metaName ?? user.email ?? 'User',
    email: user.email ?? appUser?.email ?? '',
    avatar: appUser?.avatar_url ?? null,
    companyIds: companies.map((c) => c.id),
    defaultCompanyId: companies[0]?.id ?? '',
    connectedEmail: settings.connectedEmail ?? { connected: false, email: null },
  }
}

type Props = {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  // --- Mock-mode state (used when Supabase is not configured) ---------------
  const [customAccounts, setCustomAccounts] = useState<AppAccount[]>(() =>
    SUPABASE_MODE ? [] : loadCustomAccounts(),
  )
  const [overrides, setOverrides] = useState<AccountOverrides>(() =>
    SUPABASE_MODE ? {} : loadAccountOverrides(),
  )
  const [session, setSession] = useState<{ accountId: string } | null>(() =>
    SUPABASE_MODE ? null : loadSession(),
  )

  // --- Supabase-mode state --------------------------------------------------
  const [sbAccount, setSbAccount] = useState<AppAccount | null>(null)
  const [initializing, setInitializing] = useState<boolean>(SUPABASE_MODE)

  const mockAccounts = useMemo(
    () =>
      applyAccountOverrides([...BUILTIN_ACCOUNTS, ...customAccounts], overrides),
    [customAccounts, overrides],
  )

  const mockActiveAccount = useMemo(() => {
    if (!session) return null
    return (
      mockAccounts.find((a) => a.id === session.accountId) ??
      mockAccounts.find((a) => a.id === DEFAULT_ACCOUNT_ID) ??
      null
    )
  }, [mockAccounts, session])

  const persistSession = useCallback((next: { accountId: string } | null) => {
    setSession(next)
    saveSession(next)
  }, [])

  /**
   * Load app_user + workspace for a Supabase user, fill cache, return account.
   * Does NOT auto-create a company — new users are routed to onboarding.
   */
  const loadAccountForUser = useCallback(async (user: User) => {
    const [appUser, workspace] = await Promise.all([
      getAppUser(user.id).catch(() => null),
      loadWorkspaceData(),
    ])
    setWorkspaceCache(workspace)
    const account = buildSupabaseAccount(user, appUser, workspace.companies)
    setSbAccount(account)
    return account
  }, [])

  // Restore Supabase session on mount and subscribe to auth changes.
  useEffect(() => {
    if (!SUPABASE_MODE) return
    let active = true

    ;(async () => {
      try {
        const current = await getCurrentSession()
        if (active && current?.user) {
          await loadAccountForUser(current.user)
        }
      } catch {
        // ignore — leave unauthenticated
      } finally {
        if (active) setInitializing(false)
      }
    })()

    const unsubscribe = onAuthStateChange((next) => {
      if (!active) return
      if (next?.user) {
        void loadAccountForUser(next.user)
      } else {
        setSbAccount(null)
        clearWorkspaceCache()
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [loadAccountForUser])

  const refreshWorkspace = useCallback(async () => {
    if (!SUPABASE_MODE) return
    const current = await getCurrentSession()
    if (current?.user) {
      await loadAccountForUser(current.user)
    }
  }, [loadAccountForUser])

  const login = useCallback(
    async (input: LoginInput): Promise<AuthResult> => {
      if (!input.email.trim() || !input.password.trim()) {
        return { ok: false, error: 'Email and password are required.' }
      }

      if (SUPABASE_MODE) {
        const res = await signInWithPassword(input.email, input.password)
        if (!res.ok) return { ok: false, error: res.error }
        const account = await loadAccountForUser(res.data.user)
        return { ok: true, accountId: account.id, account }
      }

      const account = findAccountByEmail(mockAccounts, input.email)
      if (!account) {
        return { ok: false, error: 'No account found for that email.' }
      }
      persistSession({ accountId: account.id })
      return { ok: true, accountId: account.id, account }
    },
    [mockAccounts, persistSession, loadAccountForUser],
  )

  const loginWithGoogle = useCallback(async () => {
    if (!SUPABASE_MODE) {
      return { ok: false as const, error: 'Google login requires Supabase.' }
    }
    const res = await signInWithGoogle()
    return res.ok ? { ok: true as const } : { ok: false as const, error: res.error }
  }, [])

  const signup = useCallback(
    async (input: SignupInput): Promise<AuthResult> => {
      if (!input.name.trim() || !input.email.trim() || !input.password.trim()) {
        return { ok: false, error: 'Name, email, and password are required.' }
      }

      if (SUPABASE_MODE) {
        const res = await signUpWithPassword(
          input.name,
          input.email,
          input.password,
        )
        if (!res.ok) return { ok: false, error: res.error }
        if (!res.data.session?.user) {
          return {
            ok: false,
            error:
              'Account created. Check your email to confirm it, then log in.',
          }
        }
        const account = await loadAccountForUser(res.data.session.user)
        return { ok: true, accountId: account.id, account }
      }

      if (findAccountByEmail(mockAccounts, input.email)) {
        return { ok: false, error: 'An account with this email already exists.' }
      }
      if (
        mockAccounts.some(
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
    [mockAccounts, customAccounts, persistSession, loadAccountForUser],
  )

  const logout = useCallback(async () => {
    if (SUPABASE_MODE) {
      await signOut()
      setSbAccount(null)
      clearWorkspaceCache()
      return
    }
    persistSession(null)
  }, [persistSession])

  const switchAccount = useCallback(
    (accountId: string) => {
      if (SUPABASE_MODE) return
      if (!mockAccounts.some((a) => a.id === accountId)) return
      persistSession({ accountId })
    },
    [mockAccounts, persistSession],
  )

  const updateConnectedEmail = useCallback(
    (settings: ConnectedEmailSettings) => {
      if (SUPABASE_MODE) {
        setSbAccount((prev) =>
          prev ? { ...prev, connectedEmail: settings } : prev,
        )
        const userId = sbAccount?.id
        if (userId) {
          void updateAppUserSettings(userId, { connectedEmail: settings }).catch(
            () => {},
          )
        }
        return
      }
      if (!mockActiveAccount) return
      const nextOverrides: AccountOverrides = {
        ...overrides,
        [mockActiveAccount.id]: {
          ...overrides[mockActiveAccount.id],
          connectedEmail: settings,
        },
      }
      setOverrides(nextOverrides)
      saveAccountOverrides(nextOverrides)
    },
    [mockActiveAccount, overrides, sbAccount],
  )

  const addCompany = useCallback(
    async (
      name: string,
      profile?: CompanyProfileInput,
    ): Promise<
      { ok: true; companyId: string } | { ok: false; error: string }
    > => {
      const trimmed = name.trim()
      if (!trimmed) {
        return { ok: false, error: 'Company name is required.' }
      }

      if (SUPABASE_MODE) {
        if (!sbAccount) {
          return { ok: false, error: 'You must be signed in to add a company.' }
        }
        const res = await sbCreateCompany(trimmed, profile)
        if (!res.ok) return { ok: false, error: res.error }
        await refreshWorkspace()
        return { ok: true, companyId: res.data.id }
      }

      if (!mockActiveAccount) {
        return { ok: false, error: 'You must be signed in to add a company.' }
      }
      if (
        getAllCompanies().some(
          (company) => normalizeName(company.name) === normalizeName(trimmed),
        )
      ) {
        return { ok: false, error: 'A company with this name already exists.' }
      }

      const company = mockCreateCompany(trimmed)
      const existingAdded = overrides[mockActiveAccount.id]?.addedCompanyIds ?? []
      const nextOverrides: AccountOverrides = {
        ...overrides,
        [mockActiveAccount.id]: {
          ...overrides[mockActiveAccount.id],
          addedCompanyIds: [...existingAdded, company.id],
        },
      }
      setOverrides(nextOverrides)
      saveAccountOverrides(nextOverrides)

      return { ok: true, companyId: company.id }
    },
    [mockActiveAccount, overrides, sbAccount, refreshWorkspace],
  )

  const activeAccount = SUPABASE_MODE ? sbAccount : mockActiveAccount
  const accounts = SUPABASE_MODE
    ? sbAccount
      ? [sbAccount]
      : []
    : mockAccounts

  const needsCompanyOnboarding =
    SUPABASE_MODE && activeAccount != null && activeAccount.companyIds.length === 0

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: activeAccount != null,
      initializing,
      activeAccount,
      accounts,
      login,
      loginWithGoogle,
      signup,
      logout,
      switchAccount,
      updateConnectedEmail,
      needsCompanyOnboarding,
      addCompany,
      refreshWorkspace,
    }),
    [
      activeAccount,
      initializing,
      accounts,
      login,
      loginWithGoogle,
      signup,
      logout,
      switchAccount,
      updateConnectedEmail,
      needsCompanyOnboarding,
      addCompany,
      refreshWorkspace,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
