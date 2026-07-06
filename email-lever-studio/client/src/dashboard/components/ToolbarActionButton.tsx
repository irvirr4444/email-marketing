import type { FC, ReactNode } from 'react'
import { Button } from '@ui/components/base/buttons/button'

type Props = {
  icon: FC<{ className?: string }>
  children: ReactNode
  trailing?: ReactNode
}

export default function ToolbarActionButton({ icon, children, trailing }: Props) {
  return (
    <Button
      color="link-color"
      size="sm"
      iconLeading={icon}
      className="gap-1 font-semibold *:data-icon:size-4 *:data-icon:stroke-[2.25px]"
    >
      <span className="flex items-center gap-1.5">
        {children}
        {trailing}
      </span>
    </Button>
  )
}
