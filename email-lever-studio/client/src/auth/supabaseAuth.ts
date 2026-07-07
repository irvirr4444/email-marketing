import type { Session, User } from '@supabase/supabase-js'
import { requireSupabase } from '../lib/supabase'
import type { AppUserRow, CompanyRow } from '../lib/database.types'

export type AuthResult<T> = { ok: true; data: T } | { ok: false; error: string }

/** Sign in an existing user with email + password. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult<Session>> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error || !data.session) {
    return { ok: false, error: error?.message ?? 'Unable to sign in.' }
  }
  return { ok: true, data: data.session }
}

/** Start a Google OAuth login with Supabase. Redirects away on success. */
export async function signInWithGoogle(): Promise<AuthResult<null>> {
  const supabase = requireSupabase()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })
  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, data: null }
}

/**
 * Create a new auth user. The `handle_new_auth_user` trigger provisions the
 * matching `app_user` row; name is stored in user metadata for that trigger.
 */
export async function signUpWithPassword(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult<{ user: User | null; session: Session | null }>> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  })
  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, data }
}

export async function signOut(): Promise<void> {
  const supabase = requireSupabase()
  await supabase.auth.signOut()
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = requireSupabase()
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Subscribe to auth state changes; returns an unsubscribe function. */
export function onAuthStateChange(
  callback: (session: Session | null) => void,
): () => void {
  const supabase = requireSupabase()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

/** Persist a patch onto the user's `app_user.settings` jsonb. */
export async function updateAppUserSettings(
  userId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = requireSupabase()
  const current = await getAppUser(userId)
  const nextSettings = { ...(current?.settings ?? {}), ...patch }
  const { error } = await supabase
    .from('app_user')
    .update({ settings: nextSettings })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

/** Load the current user's `app_user` profile row. */
export async function getAppUser(userId: string): Promise<AppUserRow | null> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as AppUserRow | null) ?? null
}

/** Companies the current user belongs to (RLS scopes to their memberships). */
export async function listMyCompanies(): Promise<CompanyRow[]> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('company')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as CompanyRow[]) ?? []
}

/** Create a company and make the caller its owner (via the create_company RPC). */
export async function createCompany(name: string): Promise<AuthResult<CompanyRow>> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('create_company', {
    p_name: name.trim(),
  })
  if (error) {
    return { ok: false, error: error.message }
  }
  return { ok: true, data: data as CompanyRow }
}

/**
 * Ensure the signed-in user has at least one company. Creates a default one
 * (named after the user) when they have none, then returns the company list.
 */
export async function ensureWorkspace(
  fallbackName: string,
): Promise<CompanyRow[]> {
  const companies = await listMyCompanies()
  if (companies.length > 0) return companies

  const created = await createCompany(fallbackName || 'My workspace')
  if (!created.ok) throw new Error(created.error)
  return [created.data]
}
