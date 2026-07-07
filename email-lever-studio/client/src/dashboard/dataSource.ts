/**
 * Unified dashboard data source. When Supabase is configured the app reads real
 * workspace data (companies, campaigns, generated emails) scoped by RLS; other-
 * wise it falls back to the in-memory mock so local development still works.
 *
 * Sync selectors read from a small module cache that the AuthProvider fills on
 * login/session-restore, mirroring the shape of the mock selectors so the
 * dashboard components stay largely unchanged.
 */
import { isSupabaseConfigured } from '../lib/supabase'
import type { Campaign, CampaignEmail, Company } from './types'
import {
  computeCampaignActivity,
  filterEmails,
  FRAMEWORK_FILTER_OPTIONS,
  FRAMEWORK_VALUES,
  getAllCampaigns as mockGetAllCampaigns,
  getCampaignById as mockGetCampaignById,
  getCampaignsForCompany as mockGetCampaignsForCompany,
  getCompaniesForAccount as mockGetCompaniesForAccount,
  getCompanyById as mockGetCompanyById,
  getDefaultCampaignForAccount as mockGetDefaultCampaignForAccount,
  getDefaultCampaignForCompany as mockGetDefaultCampaignForCompany,
  getEmailsForCampaign as mockGetEmailsForCampaign,
  isCampaignAccessible as mockIsCampaignAccessible,
  sortEmails,
} from './mock'
import {
  createCampaign as sbCreateCampaign,
  getCampaignById as sbGetCampaignById,
  listCampaignsForCompany as sbListCampaignsForCompany,
  listCompanies as sbListCompanies,
} from './data/workspace'
import { listGeneratedEmailsForCampaign } from './data/generatedEmails'
import { toCampaignEmail } from './data/toCampaignEmail'
import { createCampaignForCompany as mockCreateCampaignForCompany } from './customWorkspace'

/** True when the app should use Supabase-backed data instead of mock. */
export function isSupabaseBackend(): boolean {
  return isSupabaseConfigured()
}

// --- Supabase-backed sync cache (filled by AuthProvider) ---------------------

type WorkspaceCache = { companies: Company[]; campaigns: Campaign[] }
let cache: WorkspaceCache = { companies: [], campaigns: [] }

export function setWorkspaceCache(next: WorkspaceCache) {
  cache = next
}

export function clearWorkspaceCache() {
  cache = { companies: [], campaigns: [] }
}

/** Load the signed-in user's companies + all their campaigns from Supabase. */
export async function loadWorkspaceData(): Promise<WorkspaceCache> {
  const companies = await sbListCompanies()
  const campaignLists = await Promise.all(
    companies.map((company) => sbListCampaignsForCompany(company)),
  )
  return { companies, campaigns: campaignLists.flat() }
}

// --- Selectors (mock or cache) ----------------------------------------------

export function getAllCampaigns(): Campaign[] {
  return isSupabaseBackend() ? cache.campaigns : mockGetAllCampaigns()
}

export function getCampaignById(id: string): Campaign | undefined {
  return isSupabaseBackend()
    ? cache.campaigns.find((c) => c.id === id)
    : mockGetCampaignById(id)
}

export function getCompanyById(id: string): Company | undefined {
  return isSupabaseBackend()
    ? cache.companies.find((c) => c.id === id)
    : mockGetCompanyById(id)
}

export function getCampaignsForCompany(companyId: string): Campaign[] {
  return isSupabaseBackend()
    ? cache.campaigns.filter((c) => c.companyId === companyId)
    : mockGetCampaignsForCompany(companyId)
}

export function getDefaultCampaignForCompany(
  companyId: string,
): Campaign | undefined {
  return isSupabaseBackend()
    ? getCampaignsForCompany(companyId)[0]
    : mockGetDefaultCampaignForCompany(companyId)
}

export function getCompaniesForAccount(companyIds: string[]): Company[] {
  return isSupabaseBackend()
    ? cache.companies.filter((c) => companyIds.includes(c.id))
    : mockGetCompaniesForAccount(companyIds)
}

export function getDefaultCampaignForAccount(
  companyIds: string[],
  defaultCompanyId: string,
): Campaign | undefined {
  if (!isSupabaseBackend()) {
    return mockGetDefaultCampaignForAccount(companyIds, defaultCompanyId)
  }
  const companyId = companyIds.includes(defaultCompanyId)
    ? defaultCompanyId
    : companyIds[0]
  if (!companyId) return undefined
  return getDefaultCampaignForCompany(companyId)
}

export function isCampaignAccessible(
  campaignId: string,
  companyIds: string[],
): boolean {
  if (!isSupabaseBackend()) {
    return mockIsCampaignAccessible(campaignId, companyIds)
  }
  const campaign = getCampaignById(campaignId)
  return campaign != null && companyIds.includes(campaign.companyId)
}

// --- Async loaders -----------------------------------------------------------

/** Emails for a campaign — generated drafts from Supabase, or mock. */
export async function getEmailsForCampaign(
  campaignId: string,
): Promise<CampaignEmail[]> {
  if (!isSupabaseBackend()) {
    return mockGetEmailsForCampaign(campaignId)
  }
  const rows = await listGeneratedEmailsForCampaign(campaignId)
  return sortEmails(rows.map(toCampaignEmail))
}

/** Fetch a single campaign (used when it isn't in the cache yet). */
export async function fetchCampaign(
  campaignId: string,
): Promise<Campaign | undefined> {
  if (!isSupabaseBackend()) return mockGetCampaignById(campaignId)
  const cached = getCampaignById(campaignId)
  if (cached) return cached
  return (await sbGetCampaignById(campaignId)) ?? undefined
}

/** Create a campaign under a company. Returns the created campaign. */
export async function createCampaignForCompany(
  company: Company,
): Promise<Campaign> {
  if (!isSupabaseBackend()) {
    return mockCreateCampaignForCompany(company)
  }
  const created = await sbCreateCampaign(company.id, 'New campaign')
  return { ...created, companyName: company.name }
}

export {
  computeCampaignActivity,
  filterEmails,
  sortEmails,
  FRAMEWORK_FILTER_OPTIONS,
  FRAMEWORK_VALUES,
}
