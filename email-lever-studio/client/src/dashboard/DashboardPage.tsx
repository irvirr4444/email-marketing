import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Button } from '@ui/components/base/buttons/button'
import { useAuth } from '../auth/useAuth'
import CampaignSidebar from './components/CampaignSidebar'
import DashboardHeaderAccount from './components/DashboardHeaderAccount'
import EmailCard from './components/EmailCard'
import ActivityDrawer from './drawers/ActivityDrawer'
import FiltersDrawer from './drawers/FiltersDrawer'
import SettingsDrawer from './drawers/SettingsDrawer'
import {
  computeCampaignActivity,
  filterEmails,
  getCampaignsForCompany,
  getCompaniesForAccount,
  getDefaultCampaignForAccount,
  getDefaultCampaignForCompany,
  isCampaignAccessible,
} from './mock'
import { DEFAULT_FILTERS, type CampaignEmail, type EmailFilters } from './types'
import { useDashboardData } from './useDashboardData'

export default function DashboardPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const { activeAccount } = useAuth()
  const [filters, setFilters] = useState<EmailFilters>(DEFAULT_FILTERS)
  const { emails: fetchedEmails, campaign, loading } =
    useDashboardData(campaignId)
  const [emails, setEmails] = useState<CampaignEmail[]>([])

  const accountCompanies = useMemo(
    () =>
      activeAccount
        ? getCompaniesForAccount(activeAccount.companyIds)
        : [],
    [activeAccount],
  )

  const companyId =
    campaign?.companyId ??
    activeAccount?.defaultCompanyId ??
    accountCompanies[0]?.id ??
    ''

  const companyCampaigns = useMemo(
    () => getCampaignsForCompany(companyId),
    [companyId],
  )

  const handleCompanyChange = useCallback(
    (nextCompanyId: string) => {
      const nextCampaign = getDefaultCampaignForCompany(nextCompanyId)
      if (nextCampaign) {
        navigate(`/dashboard/campaign/${nextCampaign.id}`)
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (!activeAccount) return

    if (
      campaignId &&
      !isCampaignAccessible(campaignId, activeAccount.companyIds)
    ) {
      const fallback = getDefaultCampaignForAccount(
        activeAccount.companyIds,
        activeAccount.defaultCompanyId,
      )
      if (fallback) {
        navigate(`/dashboard/campaign/${fallback.id}`, { replace: true })
      }
    }
  }, [activeAccount, campaignId, navigate])

  useEffect(() => {
    setEmails(fetchedEmails)
  }, [fetchedEmails])

  const handleEmailUpdated = useCallback((updated: CampaignEmail) => {
    setEmails((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item)),
    )
  }, [])

  const filteredEmails = useMemo(
    () => filterEmails(emails, filters),
    [emails, filters],
  )

  const activity = useMemo(
    () => computeCampaignActivity(emails),
    [emails],
  )

  if (!activeAccount) {
    return <Navigate to="/login" replace />
  }

  if (!campaignId || (!loading && !campaign)) {
    const fallback = getDefaultCampaignForAccount(
      activeAccount.companyIds,
      activeAccount.defaultCompanyId,
    )
    return (
      <Navigate
        to={`/dashboard/campaign/${fallback?.id ?? 'camp-1'}`}
        replace
      />
    )
  }

  if (loading || !campaign) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary">
        <p className="text-sm text-tertiary">Loading campaign…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh bg-secondary">
      <CampaignSidebar
        campaigns={companyCampaigns}
        companies={accountCompanies}
        companyId={companyId}
        onCompanyChange={handleCompanyChange}
      />

      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between gap-4 border-b border-secondary bg-primary px-6 py-4">
          <h1 className="font-display text-display-xs font-semibold text-primary">
            {campaign.name}
          </h1>
          <div className="flex shrink-0 items-center gap-4">
            <nav className="flex items-center gap-4" aria-label="Campaign tools">
              <FiltersDrawer filters={filters} onChange={setFilters} />
              <ActivityDrawer
                campaignName={campaign.name}
                activity={activity}
                emailCount={emails.length}
              />
              <SettingsDrawer />
            </nav>
            <div className="hidden h-6 w-px bg-border-secondary sm:block" aria-hidden />
            <DashboardHeaderAccount />
          </div>
        </header>

        <main className="flex-1 p-6 pt-6">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-primary py-16 ring-1 ring-secondary_alt">
              <p className="text-md font-medium text-primary">No emails match</p>
              <p className="mt-1 text-sm text-tertiary">
                Adjust filters or select another campaign
              </p>
              <Button
                color="link-color"
                size="md"
                className="mt-4"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              {filteredEmails.map((email) => (
                <EmailCard
                  key={email.id}
                  email={email}
                  onEmailUpdated={handleEmailUpdated}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
