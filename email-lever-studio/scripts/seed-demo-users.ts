#!/usr/bin/env npx tsx
/**
 * Provision the two demo accounts against the live Supabase project.
 *
 * Uses the service (secret) key so it can create confirmed auth users and
 * insert company_member rows directly (bypassing RLS). The auth trigger
 * `on_auth_user_created` provisions the matching app_user row automatically.
 *
 * Both demo users are made `owner` of BOTH seeded companies (sigil and
 * Provence Beauty) so either login can explore all seeded data and switch
 * between workspaces.
 *
 * Usage:
 *   npx tsx scripts/seed-demo-users.ts
 */
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadEnv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '../../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? ''
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error(
    'Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY in .env — cannot seed demo users.',
  )
  process.exit(1)
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'sigildemo'

const DEMO_USERS = [
  { email: 'caitlyn@untitledui.com', name: 'Caitlyn King' },
  { email: 'sienna@untitledui.com', name: 'Sienna Hewitt' },
]

const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Find an existing auth user id by email (paginates admin list). */
async function findUserId(email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const match = data.users.find(
      (u) => (u.email ?? '').toLowerCase() === email.toLowerCase(),
    )
    if (match) return match.id
    if (data.users.length < 200) break
  }
  return null
}

async function ensureUser(email: string, name: string): Promise<string> {
  const existing = await findUserId(email)
  if (existing) {
    // Keep password + confirmation in sync for demo predictability.
    await admin.auth.admin.updateUserById(existing, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { name },
    })
    console.log(`  • ${email} — already existed (updated), id=${existing}`)
    return existing
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  })
  if (error || !data.user) {
    throw new Error(`createUser(${email}) failed: ${error?.message}`)
  }
  console.log(`  • ${email} — created, id=${data.user.id}`)
  return data.user.id
}

async function main() {
  console.log(`Seeding demo users against ${SUPABASE_URL}`)

  const { data: companies, error: companyErr } = await admin
    .from('company')
    .select('id, name')
    .order('name', { ascending: true })
  if (companyErr) throw new Error(companyErr.message)
  if (!companies || companies.length === 0) {
    throw new Error('No companies found — run migration 004 first.')
  }
  console.log(
    `Companies: ${companies.map((c) => `${c.name} (${c.id})`).join(', ')}`,
  )

  const userIds: string[] = []
  console.log('Users:')
  for (const u of DEMO_USERS) {
    userIds.push(await ensureUser(u.email, u.name))
  }

  // The auth trigger provisions app_user rows; wait briefly then verify.
  await new Promise((r) => setTimeout(r, 500))

  // Make each demo user an owner of every company.
  const memberRows = userIds.flatMap((userId) =>
    companies.map((c) => ({ company_id: c.id, user_id: userId, role: 'owner' })),
  )
  const { error: memberErr } = await admin
    .from('company_member')
    .upsert(memberRows, { onConflict: 'company_id,user_id' })
  if (memberErr) throw new Error(`company_member upsert failed: ${memberErr.message}`)
  console.log(`Memberships: ${memberRows.length} owner rows ensured.`)

  // Attribute company ownership to the first demo user (nice-to-have).
  await admin
    .from('company')
    .update({ created_by: userIds[0] })
    .is('created_by', null)

  console.log('\nDone. Demo credentials:')
  for (const u of DEMO_USERS) {
    console.log(`  ${u.email} / ${DEMO_PASSWORD}`)
  }
}

main().catch((err) => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
