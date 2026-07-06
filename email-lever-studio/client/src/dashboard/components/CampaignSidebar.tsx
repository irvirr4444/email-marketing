import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BadgeWithDot } from '@ui/components/base/badges/badges'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import { NavItemBase } from '@ui/components/application/app-navigation/base-components/nav-item'
import { Plus, SearchLg } from '@untitledui/icons'
import CompanySwitcher from './CompanySwitcher'
import type { Campaign, Company } from '../types'

const SIDEBAR_WIDTH = 280

const STATUS_COLOR: Record<Campaign['status'], 'success' | 'gray' | 'brand'> = {
  active: 'success',
  paused: 'gray',
  completed: 'brand',
}

export const DASHBOARD_SIDEBAR_WIDTH = SIDEBAR_WIDTH

type Props = {
  campaigns?: Campaign[]
  companies: Company[]
  companyId: string
  showCampaigns?: boolean
  onCompanyChange: (companyId: string) => void
  onAddCompany: (name: string) =>
    | { ok: true; companyId: string }
    | { ok: false; error: string }
}

export default function CampaignSidebar({
  campaigns = [],
  companies,
  companyId,
  showCampaigns,
  onCompanyChange,
  onAddCompany,
}: Props) {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const shouldShowCampaigns = showCampaigns ?? campaignId != null

  const filteredCampaigns = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return campaigns
    return campaigns.filter((c) => c.name.toLowerCase().includes(q))
  }, [query, campaigns])

  return (
    <>
      <aside
        style={{ width: SIDEBAR_WIDTH }}
        className="fixed inset-y-0 left-0 z-30 flex h-dvh flex-col border-r border-secondary bg-primary"
      >
        <div className="shrink-0 border-b border-secondary px-4 pb-3 pt-4">
          <CompanySwitcher
            companies={companies}
            companyId={companyId}
            onCompanyChange={onCompanyChange}
            onAddCompany={onAddCompany}
          />

          {shouldShowCampaigns && (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-tertiary">
                  Campaigns
                </p>
                <Button
                  size="xs"
                  color="tertiary"
                  iconLeading={Plus}
                  aria-label="New campaign"
                  className="transition-transform duration-150 active:scale-95"
                />
              </div>
              <Input
                size="sm"
                placeholder="Search campaigns"
                icon={SearchLg}
                value={query}
                onChange={setQuery}
                aria-label="Search campaigns"
                inputClassName="!py-1"
                wrapperClassName="transition-shadow duration-150 focus-within:shadow-sm"
              />
            </div>
          )}
        </div>

        {shouldShowCampaigns && (
          <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-0.5">
              {filteredCampaigns.map((campaign) => (
                <li key={campaign.id}>
                  <NavItemBase
                    type="link"
                    href={`/dashboard/campaign/${campaign.id}`}
                    current={campaignId === campaign.id}
                    onClick={(e) => {
                      e.preventDefault()
                      navigate(`/dashboard/campaign/${campaign.id}`)
                    }}
                    badge={
                      <BadgeWithDot
                        color={STATUS_COLOR[campaign.status]}
                        type="modern"
                        size="sm"
                      >
                        {campaign.emailCount}
                      </BadgeWithDot>
                    }
                  >
                    {campaign.name}
                  </NavItemBase>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-auto shrink-0 border-t border-secondary px-4 py-4">
          <p className="font-display text-md font-semibold text-primary" aria-label="Sigil AI">
            Sigil AI
          </p>
        </div>
      </aside>

      <div
        className="hidden shrink-0 lg:block"
        style={{ width: SIDEBAR_WIDTH }}
        aria-hidden
      />
    </>
  )
}
