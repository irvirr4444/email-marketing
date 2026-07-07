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

/** Core company profile captured during onboarding, stored in company.extras. */
export type CompanyProfileInput = {
  description?: string
  websiteUrl?: string
  logoUrl?: string
}

/** Build a company.extras patch from a profile, omitting empty fields. */
function buildCompanyExtras(
  profile?: CompanyProfileInput,
): Record<string, string> | null {
  if (!profile) return null
  const extras: Record<string, string> = {}
  const description = profile.description?.trim()
  const websiteUrl = profile.websiteUrl?.trim()
  const logoUrl = profile.logoUrl?.trim()
  if (description) extras.description = description
  if (websiteUrl) extras.websiteUrl = websiteUrl
  if (logoUrl) extras.logoUrl = logoUrl
  return Object.keys(extras).length > 0 ? extras : null
}

/**
 * Create a company and make the caller its owner (via the create_company RPC).
 * Optional profile fields are stored in `company.extras` with a follow-up
 * update (allowed by RLS because the caller is now the company owner).
 */
export async function createCompany(
  name: string,
  profile?: CompanyProfileInput,
): Promise<AuthResult<CompanyRow>> {
  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('create_company', {
    p_name: name.trim(),
  })
  if (error) {
    return { ok: false, error: error.message }
  }

  let company = data as CompanyRow
  const extras = buildCompanyExtras(profile)
  if (extras) {
    const { data: updated, error: updateError } = await supabase
      .from('company')
      .update({ extras })
      .eq('id', company.id)
      .select('*')
      .single()
    if (!updateError && updated) {
      company = updated as CompanyRow
    }
  }

  return { ok: true, data: company }
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
