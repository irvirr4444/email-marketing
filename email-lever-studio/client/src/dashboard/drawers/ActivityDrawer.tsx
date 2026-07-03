import { Badge } from '@ui/components/base/badges/badges'
import { SlideoutMenu } from '@ui/components/application/slideout-menus/slideout-menu'
import { BarChartSquare02 } from '@untitledui/icons'
import ToolbarActionButton from '../components/ToolbarActionButton'
import type { CampaignActivity } from '../types'

type Props = {
  campaignName: string
  activity: CampaignActivity
  emailCount: number
}

function MetricRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-secondary last:border-0">
      <span className="text-sm text-tertiary">{label}</span>
      <span className="text-sm font-semibold text-primary tabular-nums">{value}</span>
    </div>
  )
}

export default function ActivityDrawer({
  campaignName,
  activity,
  emailCount,
}: Props) {
  return (
    <SlideoutMenu.Trigger>
      <ToolbarActionButton icon={BarChartSquare02}>Activity</ToolbarActionButton>
      <SlideoutMenu>
        {({ close }) => (
          <>
            <SlideoutMenu.Header onClose={close}>
              <h2 className="text-lg font-semibold text-primary">Activity</h2>
              <p className="mt-1 text-sm text-tertiary">
                Campaign metrics for {campaignName}
              </p>
              <Badge color="gray" size="sm" className="mt-3">
                {emailCount} emails in campaign
              </Badge>
            </SlideoutMenu.Header>
            <SlideoutMenu.Content>
              <div className="rounded-xl ring-1 ring-secondary_alt bg-primary px-4">
                <MetricRow label="Total sent" value={activity.totalSent} />
                <MetricRow
                  label="Total delivered"
                  value={activity.totalDelivered}
                />
                <MetricRow label="Total opened" value={activity.totalOpens} />
                <MetricRow
                  label="Total links clicked"
                  value={activity.totalClicks}
                />
                <MetricRow label="Total replied" value={activity.totalReplies} />
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
                  Averages (sent emails)
                </p>
                <div className="rounded-xl ring-1 ring-secondary_alt bg-primary px-4">
                  <MetricRow
                    label="Avg open rate"
                    value={`${activity.avgOpenRate.toFixed(1)}%`}
                  />
                  <MetricRow
                    label="Avg click rate"
                    value={`${activity.avgClickRate.toFixed(1)}%`}
                  />
                  <MetricRow
                    label="Avg reply rate"
                    value={`${activity.avgReplyRate.toFixed(1)}%`}
                  />
                </div>
              </div>
            </SlideoutMenu.Content>
          </>
        )}
      </SlideoutMenu>
    </SlideoutMenu.Trigger>
  )
}
