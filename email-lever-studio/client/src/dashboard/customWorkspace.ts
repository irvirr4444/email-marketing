import type { Campaign, Company } from './types'

const CUSTOM_COMPANIES_KEY = 'sigil-custom-companies'
const CUSTOM_CAMPAIGNS_KEY = 'sigil-custom-campaigns'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function loadCustomCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(CUSTOM_COMPANIES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Company[]
  } catch {
    return []
  }
}

export function loadCustomCampaigns(): Campaign[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CAMPAIGNS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Campaign[]
  } catch {
    return []
  }
}

function saveCustomCompanies(companies: Company[]) {
  localStorage.setItem(CUSTOM_COMPANIES_KEY, JSON.stringify(companies))
}

function saveCustomCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(CUSTOM_CAMPAIGNS_KEY, JSON.stringify(campaigns))
}

/** Create a user-owned company without campaigns (mock workspace). */
export function createCompany(name: string): Company {
  const trimmed = name.trim()
  const slug = slugify(trimmed) || 'company'
  const timestamp = Date.now()
  const companyId = `co-custom-${slug}-${timestamp}`

  const company: Company = { id: companyId, name: trimmed }

  saveCustomCompanies([...loadCustomCompanies(), company])

  return company
}

/** Create a campaign under an existing company in the mock workspace. */
export function createCampaignForCompany(company: Company): Campaign {
  const slug = slugify(company.name) || 'campaign'
  const timestamp = Date.now()
  const campaign: Campaign = {
    id: `camp-custom-${slug}-${timestamp}`,
    name: 'New campaign',
    companyId: company.id,
    companyName: company.name,
    status: 'active',
    emailCount: 0,
  }

  saveCustomCampaigns([...loadCustomCampaigns(), campaign])

  return campaign
}
