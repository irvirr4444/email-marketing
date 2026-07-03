import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { BadgeWithDot } from '@ui/components/base/badges/badges'
import { Button } from '@ui/components/base/buttons/button'
import { Input } from '@ui/components/base/input/input'
import { NavItemBase } from '@ui/components/application/app-navigation/base-components/nav-item'
import { NavAccountCard } from '@ui/components/application/app-navigation/base-components/nav-account-card'
import { Plus, SearchLg, Zap } from '@untitledui/icons'
import { MOCK_CAMPAIGNS } from '../mock'
import type { Campaign } from '../types'

const SIDEBAR_WIDTH = 280

const STATUS_COLOR: Record<Campaign['status'], 'success' | 'gray' | 'brand'> = {
  active: 'success',
  paused: 'gray',
  completed: 'brand',
}

export const DASHBOARD_SIDEBAR_WIDTH = SIDEBAR_WIDTH

type Props = {
  campaigns?: Campaign[]
}

export default function CampaignSidebar({ campaigns = MOCK_CAMPAIGNS }: Props) {
  const { campaignId } = useParams<{ campaignId: string }>()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

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
        <div className="shrink-0 border-b border-secondary px-4 pb-2 pt-3">
          <div className="flex items-center gap-1.5" aria-label="Email Lever Studio">
            <span className="flex size-6 items-center justify-center rounded-md bg-brand-solid text-white shadow-xs">
              <Zap className="size-3" />
            </span>
            <div>
              <p className="text-xs font-semibold text-primary">Email Lever</p>
              <p className="text-[0.625rem] leading-tight text-tertiary">Studio</p>
            </div>
          </div>

          <div className="mt-2.5">
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
        </div>

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

        <div className="mt-auto shrink-0 border-t border-secondary px-3 py-4">
          <NavAccountCard />
        </div>
      </aside>

      {/* Spacer so main content doesn't sit under the fixed sidebar */}
      <div
        className="hidden shrink-0 lg:block"
        style={{ width: SIDEBAR_WIDTH }}
        aria-hidden
      />
    </>
  )
}
