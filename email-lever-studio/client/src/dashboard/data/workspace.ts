import { requireSupabase } from '../../lib/supabase'
import type {
  CampaignRow,
  CompanyRow,
  WritingStyleRow,
} from '../../lib/database.types'
import type { Campaign, Company } from '../types'

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

/** Create a campaign under a company. */
export async function createCampaign(
  companyId: string,
  name: string,
): Promise<Campaign> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('campaign')
    .insert({ company_id: companyId, name: name.trim() })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  const row = data as CampaignRow
  return toCampaign(row, '', 0)
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
