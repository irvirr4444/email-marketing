import { useRef } from 'react'
import { ChevronSelectorVertical } from '@untitledui/icons'
import {
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
  Button as AriaButton,
} from 'react-aria-components'
import { Avatar } from '@ui/components/base/avatar/avatar'
import { NavAccountMenu } from '@ui/components/application/app-navigation/base-components/nav-account-card'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cx } from '@/utils/cx'

const ACCOUNT = {
  id: 'caitlyn',
  name: 'Caitlyn King',
  email: 'caitlyn@untitledui.com',
  avatar:
    'https://www.untitledui.com/images/avatars/caitlyn-king?fm=webp&q=80',
  status: 'online' as const,
}

export default function DashboardHeaderAccount() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isDesktop = useBreakpoint('lg')

  return (
    <AriaDialogTrigger>
      <AriaButton
        ref={triggerRef}
        className={({ isPressed, isFocused }) =>
          cx(
            'flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 outline-hidden transition duration-100 ease-linear',
            (isPressed || isFocused) && 'bg-primary_hover',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          )
        }
      >
        <Avatar
          size="sm"
          src={ACCOUNT.avatar}
          alt={ACCOUNT.name}
          status={ACCOUNT.status}
        />
        <span className="hidden max-w-[8rem] truncate text-sm font-semibold text-secondary sm:inline">
          {ACCOUNT.name}
        </span>
        <ChevronSelectorVertical className="size-4 shrink-0 text-fg-quaternary" />
      </AriaButton>
      <AriaPopover
        placement={isDesktop ? 'bottom end' : 'bottom'}
        triggerRef={triggerRef}
        offset={8}
        className={({ isEntering, isExiting }) =>
          cx(
            'origin-(--trigger-anchor-point) will-change-transform',
            isEntering &&
              'duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5',
            isExiting &&
              'duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5',
          )
        }
      >
        <NavAccountMenu selectedAccountId={ACCOUNT.id} />
      </AriaPopover>
    </AriaDialogTrigger>
  )
}
