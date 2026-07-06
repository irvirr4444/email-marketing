import { Badge } from '@ui/components/base/badges/badges'
import {
  Tooltip,
  TooltipTrigger,
} from '@ui/components/base/tooltip/tooltip'

type Props = {
  value: string
  meaning: string | null
  primary?: boolean
}

export default function VariableValueBadge({ value, meaning, primary }: Props) {
  const badge = (
    <Badge color={primary ? 'brand' : 'gray'} size="sm">
      <span className="font-medium">{value}</span>
    </Badge>
  )

  if (!meaning) return badge

  return (
    <Tooltip title={value} description={meaning} placement="top">
      <TooltipTrigger className="shrink-0 cursor-default rounded-full outline-hidden">
        {badge}
      </TooltipTrigger>
    </Tooltip>
  )
}
