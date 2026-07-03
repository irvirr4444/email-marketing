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
      color="tertiary"
      size="sm"
      iconLeading={icon}
      className="rounded-md px-2.5 py-2 font-semibold text-secondary hover:bg-primary_hover hover:text-secondary_hover *:data-icon:stroke-[2.25px]"
    >
      <span className="flex items-center gap-2">
        {children}
        {trailing}
      </span>
    </Button>
  )
}
