import { useCallback, useEffect, useState } from 'react'
import {
  fetchCampaignEmails,
  fetchCampaigns,
  isMockDashboard,
} from './api'
import {
  getAllCampaigns,
  getCampaignById,
  getEmailsForCampaign,
} from './mock'
import type { Campaign, CampaignEmail } from './types'

type State = {
  campaigns: Campaign[]
  emails: CampaignEmail[]
  loading: boolean
  error: string | null
}

export function useDashboardData(campaignId: string | undefined) {
  const [state, setState] = useState<State>({
    campaigns: [],
    emails: [],
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    if (!campaignId) {
      setState((s) => ({ ...s, loading: false }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    if (isMockDashboard()) {
      setState({
        campaigns: getAllCampaigns(),
        emails: getEmailsForCampaign(campaignId),
        loading: false,
        error: null,
      })
      return
    }

    try {
      const [campaigns, emails] = await Promise.all([
        fetchCampaigns(),
        fetchCampaignEmails(campaignId),
      ])
      setState({ campaigns, emails, loading: false, error: null })
    } catch (err) {
      setState({
        campaigns: getAllCampaigns(),
        emails: getEmailsForCampaign(campaignId),
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load dashboard',
      })
    }
  }, [campaignId])

  useEffect(() => {
    void load()
  }, [load])

  const campaign = campaignId
    ? state.campaigns.find((c) => c.id === campaignId) ??
      getCampaignById(campaignId)
    : undefined

  return {
    ...state,
    campaign,
    refresh: load,
  }
}
