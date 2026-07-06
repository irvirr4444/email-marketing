import { Navigate } from 'react-router'
import {
  getDefaultCampaignForAccount,
  MOCK_CAMPAIGNS,
} from '../dashboard/mock'
import { useAuth } from './useAuth'

/** Sends authenticated users to their account's default campaign. */
export default function DashboardDefaultRedirect() {
  const { activeAccount } = useAuth()
  const fallback = activeAccount
    ? getDefaultCampaignForAccount(
        activeAccount.companyIds,
        activeAccount.defaultCompanyId,
      )
    : undefined

  return (
    <Navigate
      to={`/dashboard/campaign/${fallback?.id ?? MOCK_CAMPAIGNS[0]?.id ?? 'camp-1'}`}
      replace
    />
  )
}
