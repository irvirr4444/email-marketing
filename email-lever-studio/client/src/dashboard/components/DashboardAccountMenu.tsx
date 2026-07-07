import type { FC, HTMLAttributes } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import {
  LogOut01,
  Moon01,
  Plus,
  Sun,
} from '@untitledui/icons'
import { useFocusManager } from 'react-aria'
import type { DialogProps as AriaDialogProps } from 'react-aria-components'
import {
  Dialog as AriaDialog,
} from 'react-aria-components'
import { AvatarLabelGroup } from '@ui/components/base/avatar/avatar-label-group'
import { Button } from '@ui/components/base/buttons/button'
import { RadioButtonBase } from '@ui/components/base/radio-buttons/radio-buttons'
import { Toggle } from '@ui/components/base/toggle/toggle'
import { useTheme } from '@ui/providers/theme-provider'
import { cx } from '@/utils/cx'
import { useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import type { AppAccount } from '../../auth/types'

type Props = AriaDialogProps & {
  className?: string
}

/** Dashboard account menu with account switching wired to mock auth. */
export default function DashboardAccountMenu({ className, ...dialogProps }: Props) {
  const { accounts, activeAccount, switchAccount, logout } = useAuth()
  const navigate = useNavigate()
  const focusManager = useFocusManager()
  const dialogRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          focusManager?.focusNext({ tabbable: true, wrap: true })
          break
        case 'ArrowUp':
          focusManager?.focusPrevious({ tabbable: true, wrap: true })
          break
      }
    },
    [focusManager],
  )

  useEffect(() => {
    const element = dialogRef.current
    if (element) element.addEventListener('keydown', onKeyDown)
    return () => {
      if (element) element.removeEventListener('keydown', onKeyDown)
    }
  }, [onKeyDown])

  const handleSwitch = (account: AppAccount) => {
    switchAccount(account.id)
    navigate('/dashboard', { replace: true })
  }

  const handleSignOut = () => {
    void Promise.resolve(logout()).finally(() => {
      navigate('/login', { replace: true })
    })
  }

  const handleAddAccount = () => {
    navigate('/login', { state: { signup: true } })
  }

  return (
    <AriaDialog
      {...dialogProps}
      ref={dialogRef}
      className={cx(
        'w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden',
        className,
      )}
    >
      <div className="rounded-xl bg-primary ring-1 ring-secondary">
        <div className="flex flex-col gap-0.5 border-b border-secondary py-1.5">
          <div className="px-1.5">
            <div className="flex items-center justify-between gap-3 rounded-md p-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                {isDarkMode ? (
                  <Moon01 className="size-5 text-fg-quaternary" />
                ) : (
                  <Sun className="size-5 text-fg-quaternary" />
                )}
                {isDarkMode ? 'Dark mode' : 'Light mode'}
              </div>
              <Toggle
                slim
                size="sm"
                aria-label="Toggle dark mode"
                isSelected={isDarkMode}
                onChange={(selected) => setTheme(selected ? 'dark' : 'light')}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 border-b border-secondary py-1.5">
          <div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-tertiary">
            Switch account
          </div>
          <div className="flex flex-col gap-0.5 px-1.5">
            {accounts.map((account) => {
              const selected = account.id === activeAccount?.id
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleSwitch(account)}
                  className={cx(
                    'relative w-full cursor-pointer rounded-md px-2 py-1.5 text-left outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                    selected && 'bg-primary_hover',
                    !selected && 'hover:bg-primary_hover',
                  )}
                >
                  <AvatarLabelGroup
                    status="online"
                    size="md"
                    src={account.avatar ?? undefined}
                    title={account.name}
                    subtitle={account.email}
                  />
                  <RadioButtonBase
                    isSelected={selected}
                    className="absolute top-2 right-2"
                  />
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 px-2 py-2">
          <Button
            iconLeading={Plus}
            color="secondary"
            size="sm"
            onClick={handleAddAccount}
          >
            Add account
          </Button>
        </div>
      </div>

      <div className="pt-1 pb-1.5">
        <MenuItem label="Sign out" icon={LogOut01} onClick={handleSignOut} />
      </div>
    </AriaDialog>
  )
}

function MenuItem({
  icon: Icon,
  label,
  ...buttonProps
}: {
  icon?: FC<{ className?: string }>
  label: string
} & HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...buttonProps}
      className={cx(
        'group/item w-full cursor-pointer px-1.5 outline-hidden',
        buttonProps.className,
      )}
    >
      <div className="flex w-full items-center gap-2 rounded-md p-2 text-sm font-semibold text-secondary group-hover/item:bg-primary_hover">
        {Icon && <Icon className="size-5 text-fg-quaternary" />}
        {label}
      </div>
    </button>
  )
}
