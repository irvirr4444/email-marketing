import { requireSupabase } from '../../lib/supabase'
import type {
  CampaignRow,
  CompanyRow,
  WritingStyleRow,
} from '../../lib/database.types'
import type { SocialProofAssets } from '../../../../shared/schema.ts'
import type { Campaign, CampaignBriefUpdate, Company } from '../types'

/** Map a company row to the app `Company` shape used across the dashboard. */
export function toCompany(row: CompanyRow): Company {
  return { id: row.id, name: row.name }
}

/** Map a campaign row to the app `Campaign` shape (emailCount filled separately). */
export function toCampaign(
  row: CampaignRow,
  companyName: string,
  emailCount = 0,
): Campaign {
  return {
    id: row.id,
    name: row.name,
    companyId: row.company_id,
    companyName,
    status: row.status,
    emailCount,
    productDescription: row.product_description,
    productUrl: row.product_url,
    goal: row.goal,
    socialProofAssets: (row.social_proof_assets ?? {}) as SocialProofAssets,
    socialProofStatus: row.social_proof_status,
  }
}

/** Companies the signed-in user can access (RLS-scoped). */
export async function listCompanies(): Promise<Company[]> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('company')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data as CompanyRow[]) ?? []).map(toCompany)
}

/** Campaigns for a company, with generated-email counts. */
export async function listCampaignsForCompany(
  company: Company,
): Promise<Campaign[]> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('campaign')
    .select('*')
    .eq('company_id', company.id)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)

  const rows = (data as CampaignRow[]) ?? []

  const counts = await countEmailsByCampaign(rows.map((r) => r.id))
  return rows.map((row) => toCampaign(row, company.name, counts[row.id] ?? 0))
}

/** Count generated emails per campaign id (single query, tallied client-side). */
async function countEmailsByCampaign(
  campaignIds: string[],
): Promise<Record<string, number>> {
  if (campaignIds.length === 0) return {}
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('generated_email')
    .select('campaign_id')
    .in('campaign_id', campaignIds)
  if (error) throw new Error(error.message)

  const tally: Record<string, number> = {}
  for (const row of (data as Array<{ campaign_id: string | null }>) ?? []) {
    if (row.campaign_id) {
      tally[row.campaign_id] = (tally[row.campaign_id] ?? 0) + 1
    }
  }
  return tally
}

/** A single campaign by id (RLS-scoped), with its company name resolved. */
export async function getCampaignById(
  campaignId: string,
): Promise<Campaign | null> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('campaign')
    .select('*, company_ref:company_id (name)')
    .eq('id', campaignId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const row = data as CampaignRow & { company_ref: { name: string } | null }
  const counts = await countEmailsByCampaign([row.id])
  return toCampaign(row, row.company_ref?.name ?? '', counts[row.id] ?? 0)
}

async function getNextCampaignName(
  companyId: string,
  baseName: string,
): Promise<string> {
  const supabase = requireSupabase()
  const normalizedBase = baseName.trim()
  const { data, error } = await supabase
    .from('campaign')
    .select('name')
    .eq('company_id', companyId)
    .ilike('name', `${normalizedBase}%`)
  if (error) throw new Error(error.message)

  const names = new Set(
    ((data as Array<{ name: string }> | null) ?? []).map((row) =>
      row.name.toLowerCase(),
    ),
  )
  if (!names.has(normalizedBase.toLowerCase())) return normalizedBase

  let suffix = 2
  while (names.has(`${normalizedBase} ${suffix}`.toLowerCase())) {
    suffix += 1
  }
  return `${normalizedBase} ${suffix}`
}

function isDuplicateCampaignNameError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String(error.code) : ''
  const message = 'message' in error ? String(error.message) : ''
  return (
    code === '23505' ||
    message.includes('campaign_company_name_lower_idx') ||
    message.includes('duplicate key value')
  )
}

/** Create a campaign under a company. */
export async function createCampaign(
  companyId: string,
  name: string,
): Promise<Campaign> {
  const supabase = requireSupabase()
  const baseName = name.trim()
  let candidate = await getNextCampaignName(companyId, baseName)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from('campaign')
      .insert({ company_id: companyId, name: candidate })
      .select('*')
      .single()
    if (!error) {
      const row = data as CampaignRow
      return toCampaign(row, '', 0)
    }
    if (!isDuplicateCampaignNameError(error)) {
      throw new Error(error.message)
    }
    // Handle concurrent creates by recomputing the next available name.
    candidate = await getNextCampaignName(companyId, baseName)
  }

  throw new Error('Could not create campaign. Please try again.')
}

/** Persist campaign brief / social-proof edits. Returns the updated campaign. */
export async function updateCampaignBrief(
  campaignId: string,
  patch: CampaignBriefUpdate,
): Promise<Campaign> {
  const supabase = requireSupabase()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('productDescription' in patch) update.product_description = patch.productDescription
  if ('productUrl' in patch) update.product_url = patch.productUrl
  if ('goal' in patch) update.goal = patch.goal
  if ('socialProofAssets' in patch) update.social_proof_assets = patch.socialProofAssets
  if ('socialProofStatus' in patch) update.social_proof_status = patch.socialProofStatus

  const { data, error } = await supabase
    .from('campaign')
    .update(update)
    .eq('id', campaignId)
    .select('*, company_ref:company_id (name)')
    .single()
  if (error) throw new Error(error.message)

  const row = data as CampaignRow & { company_ref: { name: string } | null }
  const counts = await countEmailsByCampaign([row.id])
  return toCampaign(row, row.company_ref?.name ?? '', counts[row.id] ?? 0)
}

/** Writing style catalog, ordered for display. */
export async function listWritingStyles(): Promise<WritingStyleRow[]> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('writing_style')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as WritingStyleRow[]) ?? []
}
