import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { Plus } from '@untitledui/icons'
import { Button } from '@ui/components/base/buttons/button'
import { useAuth } from '../auth/useAuth'
import AppSnackbar from '../components/AppSnackbar'
import CampaignSidebar from './components/CampaignSidebar'
import CampaignSetup from './components/CampaignSetup'
import DashboardHeaderAccount from './components/DashboardHeaderAccount'
import EmailCard from './components/EmailCard'
import FirstCompanyOnboarding from './components/FirstCompanyOnboarding'
import ActivityDrawer from './drawers/ActivityDrawer'
import FiltersDrawer from './drawers/FiltersDrawer'
import SettingsDrawer from './drawers/SettingsDrawer'
import {
  computeCampaignActivity,
  filterEmails,
  getCompanyById,
  getCampaignsForCompany,
  getCompaniesForAccount,
  getDefaultCampaignForAccount,
  getDefaultCampaignForCompany,
  isCampaignAccessible,
} from './dataSource'
import {
  DEFAULT_FILTERS,
  isCampaignSetupComplete,
  type CampaignEmail,
  type EmailFilters,
} from './types'
import { useDashboardData } from './useDashboardData'

export default function DashboardPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const { activeAccount, addCompany, needsCompanyOnboarding, refreshWorkspace } =
    useAuth()
  const [filters, setFilters] = useState<EmailFilters>(DEFAULT_FILTERS)
  const {
    emails: fetchedEmails,
    campaign,
    loading,
    refresh: refreshDashboard,
  } = useDashboardData(campaignId)
  const [emails, setEmails] = useState<CampaignEmail[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [draftSetupCompanyId, setDraftSetupCompanyId] = useState<string | null>(
    null,
  )
  const [snackbar, setSnackbar] = useState<{
    message: string
    variant: 'error'
  } | null>(null)
  const dismissSnackbar = useCallback(() => setSnackbar(null), [])

  const accountCompanies = useMemo(
    () =>
      activeAccount
        ? getCompaniesForAccount(activeAccount.companyIds)
        : [],
    [activeAccount],
  )

  useEffect(() => {
    if (!activeAccount) return

    setSelectedCompanyId((current) =>
      current && activeAccount.companyIds.includes(current)
        ? current
        : activeAccount.defaultCompanyId || accountCompanies[0]?.id || '',
    )
  }, [activeAccount, accountCompanies])

  const companyId =
    campaign?.companyId ?? (selectedCompanyId || accountCompanies[0]?.id || '')

  const selectedCompany =
    getCompanyById(companyId) ?? accountCompanies.find((c) => c.id === companyId)
  const draftSetupCompany =
    draftSetupCompanyId != null
      ? getCompanyById(draftSetupCompanyId) ??
        accountCompanies.find((c) => c.id === draftSetupCompanyId)
      : null

  const companyCampaigns = useMemo(
    () => getCampaignsForCompany(companyId),
    [companyId],
  )

  // When landing on /dashboard for a company that already has campaigns, jump
  // straight into its first campaign. The company-level empty state is only for
  // companies with zero campaigns.
  useEffect(() => {
    if (campaignId || draftSetupCompanyId || companyCampaigns.length === 0) return
    navigate(`/dashboard/campaign/${companyCampaigns[0].id}`, { replace: true })
  }, [campaignId, companyCampaigns, draftSetupCompanyId, navigate])

  const handleCompanyChange = useCallback(
    (nextCompanyId: string) => {
      setDraftSetupCompanyId(null)
      if (!campaignId) {
        setSelectedCompanyId(nextCompanyId)
        return
      }

      const nextCampaign = getDefaultCampaignForCompany(nextCompanyId)
      if (nextCampaign) {
        navigate(`/dashboard/campaign/${nextCampaign.id}`)
        return
      }

      setSelectedCompanyId(nextCompanyId)
      navigate('/dashboard')
    },
    [campaignId, navigate],
  )

  const handleAddCompany = useCallback(
    (name: string) => addCompany(name),
    [addCompany],
  )

  const handleCreateCampaign = useCallback(() => {
    const company = getCompanyById(companyId)
    if (!company) return

    setSelectedCompanyId(company.id)
    setDraftSetupCompanyId(company.id)
  }, [companyId])

  const handleCampaignNavigation = useCallback(() => {
    setDraftSetupCompanyId(null)
  }, [])

  const handleCampaignStarted = useCallback(
    (nextCampaign: { id: string }) => {
      void (async () => {
        await refreshWorkspace()
        setDraftSetupCompanyId(null)
        navigate(`/dashboard/campaign/${nextCampaign.id}`)
      })()
    },
    [navigate, refreshWorkspace],
  )

  const handleSetupApproved = useCallback(() => {
    void (async () => {
      await refreshWorkspace()
      await refreshDashboard()
    })()
  }, [refreshWorkspace, refreshDashboard])

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
  const hasCampaignActivity = emails.length > 0

  if (!activeAccount) {
    return <Navigate to="/login" replace />
  }

  if (needsCompanyOnboarding) {
    return <FirstCompanyOnboarding />
  }

  if (campaignId && !loading && !campaign) {
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

  if (draftSetupCompany) {
    return (
      <>
        <div className="flex min-h-dvh bg-secondary">
          <CampaignSidebar
            campaigns={companyCampaigns}
            companies={accountCompanies}
            companyId={draftSetupCompany.id}
            showCampaigns
            onCompanyChange={handleCompanyChange}
            onAddCompany={handleAddCompany}
            onCreateCampaign={handleCreateCampaign}
            onCampaignSelect={handleCampaignNavigation}
          />

          <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
            <header className="flex items-center justify-between gap-4 border-b border-secondary bg-primary px-6 py-4">
              <h1 className="font-display text-display-xs font-semibold text-primary">
                New campaign
              </h1>
              <DashboardHeaderAccount />
            </header>

            <main className="flex-1 p-6">
              <CampaignSetup
                company={draftSetupCompany}
                onApproved={handleSetupApproved}
                onStarted={handleCampaignStarted}
              />
            </main>
          </div>
        </div>
        {snackbar && (
          <AppSnackbar
            message={snackbar.message}
            variant={snackbar.variant}
            onDismiss={dismissSnackbar}
          />
        )}
      </>
    )
  }

  if (!campaignId) {
    return (
      <>
        <div className="flex min-h-dvh bg-secondary">
          <CampaignSidebar
            campaigns={companyCampaigns}
            companies={accountCompanies}
            companyId={companyId}
            showCampaigns={false}
            onCompanyChange={handleCompanyChange}
            onAddCompany={handleAddCompany}
            onCreateCampaign={handleCreateCampaign}
            onCampaignSelect={handleCampaignNavigation}
          />

          <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
            <header className="flex items-center justify-between gap-4 border-b border-secondary bg-primary px-6 py-4">
              <h1 className="font-display text-display-xs font-semibold text-primary">
                {selectedCompany?.name ?? 'Dashboard'}
              </h1>
              <DashboardHeaderAccount />
            </header>

            <main className="flex flex-1 items-center justify-center p-6">
              <div className="flex max-w-sm flex-col items-center justify-center text-center">
                <p className="font-display text-display-xs font-semibold text-primary">
                  Let&apos;s create our first campaign.
                </p>
                <p className="mt-2 max-w-sm text-sm text-tertiary">
                  Start with an empty campaign for{' '}
                  {selectedCompany?.name ?? 'this company'}, then generate emails
                  when you&apos;re ready.
                </p>
                <Button
                  color="primary"
                  size="md"
                  iconLeading={Plus}
                  className="mt-6 shadow-xs hover:-translate-y-px hover:shadow-md"
                  onClick={handleCreateCampaign}
                >
                  Create new campaign
                </Button>
              </div>
            </main>
          </div>
        </div>
        {snackbar && (
          <AppSnackbar
            message={snackbar.message}
            variant={snackbar.variant}
            onDismiss={dismissSnackbar}
          />
        )}
      </>
    )
  }

  if (loading || !campaign) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-secondary">
        <p className="text-sm text-tertiary">Loading campaign…</p>
      </div>
    )
  }

  if (!isCampaignSetupComplete(campaign)) {
    return (
      <>
        <div className="flex min-h-dvh bg-secondary">
          <CampaignSidebar
            campaigns={companyCampaigns}
            companies={accountCompanies}
            companyId={companyId}
            showCampaigns
            onCompanyChange={handleCompanyChange}
            onAddCompany={handleAddCompany}
            onCreateCampaign={handleCreateCampaign}
            onCampaignSelect={handleCampaignNavigation}
          />

          <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
            <header className="flex items-center justify-between gap-4 border-b border-secondary bg-primary px-6 py-4">
              <h1 className="font-display text-display-xs font-semibold text-primary">
                {campaign.name}
              </h1>
              <DashboardHeaderAccount />
            </header>

            <main className="flex-1 p-6">
              <CampaignSetup
                campaign={campaign}
                company={selectedCompany ?? { id: campaign.companyId, name: campaign.companyName }}
                onApproved={handleSetupApproved}
              />
            </main>
          </div>
        </div>
        {snackbar && (
          <AppSnackbar
            message={snackbar.message}
            variant={snackbar.variant}
            onDismiss={dismissSnackbar}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="flex min-h-dvh bg-secondary">
        <CampaignSidebar
          campaigns={companyCampaigns}
          companies={accountCompanies}
          companyId={companyId}
          showCampaigns
          onCompanyChange={handleCompanyChange}
          onAddCompany={handleAddCompany}
          onCreateCampaign={handleCreateCampaign}
          onCampaignSelect={handleCampaignNavigation}
        />

        <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="flex items-center justify-between gap-4 border-b border-secondary bg-primary px-6 py-4">
            <h1 className="font-display text-display-xs font-semibold text-primary">
              {campaign.name}
            </h1>
            <div className="flex shrink-0 items-center gap-4">
              {hasCampaignActivity && (
                <>
                  <nav
                    className="flex items-center gap-4"
                    aria-label="Campaign tools"
                  >
                    <FiltersDrawer filters={filters} onChange={setFilters} />
                    <ActivityDrawer
                      campaignName={campaign.name}
                      activity={activity}
                      emailCount={emails.length}
                    />
                    <SettingsDrawer />
                  </nav>
                  <div
                    className="hidden h-6 w-px bg-border-secondary sm:block"
                    aria-hidden
                  />
                </>
              )}
              <DashboardHeaderAccount />
            </div>
          </header>

          <main
            className={
              emails.length === 0
                ? 'flex flex-1 items-center justify-center p-6'
                : 'flex-1 p-6 pt-6'
            }
          >
            {emails.length === 0 ? (
              <div className="flex max-w-sm flex-col items-center justify-center text-center">
                <p className="font-display text-display-xs font-semibold text-primary">
                  No emails generated yet.
                </p>
                <p className="mt-2 max-w-sm text-sm text-tertiary">
                  This campaign has been created for {campaign.companyName}.
                  Generate your first email when you&apos;re ready.
                </p>
                <Button
                  color="primary"
                  size="md"
                  iconLeading={Plus}
                  className="mt-6 shadow-xs hover:-translate-y-px hover:shadow-md"
                >
                  Generate first email
                </Button>
              </div>
            ) : filteredEmails.length === 0 ? (
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
      {snackbar && (
        <AppSnackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onDismiss={dismissSnackbar}
        />
      )}
    </>
  )
}
