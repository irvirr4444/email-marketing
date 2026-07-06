import { useRef } from 'react'
import { Building07, ChevronSelectorVertical, Plus } from '@untitledui/icons'
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Popover as AriaPopover,
} from 'react-aria-components'
import { Button } from '@ui/components/base/buttons/button'
import { RadioButtonBase } from '@ui/components/base/radio-buttons/radio-buttons'
import { useBreakpoint } from '@/hooks/use-breakpoint'
import { cx } from '@/utils/cx'
import type { Company } from '../types'

type Props = {
  companies: Company[]
  companyId: string
  onCompanyChange: (companyId: string) => void
}

export default function CompanySwitcher({
  companies,
  companyId,
  onCompanyChange,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isDesktop = useBreakpoint('lg')
  const selected =
    companies.find((company) => company.id === companyId) ?? companies[0]

  if (!selected) return null

  return (
    <AriaDialogTrigger>
      <AriaButton
        ref={triggerRef}
        className={({ isPressed, isFocused }) =>
          cx(
            'group flex w-full cursor-pointer flex-col gap-0.5 rounded-lg px-1 py-1 text-left outline-hidden transition duration-100 ease-linear',
            (isPressed || isFocused) && 'bg-primary_hover',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
          )
        }
      >
        <span className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-tertiary">
          Company
        </span>
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-md font-semibold text-primary">
            {selected.name}
          </span>
          <ChevronSelectorVertical className="size-4 shrink-0 text-fg-quaternary transition-colors group-hover:text-fg-quaternary_hover" />
        </span>
      </AriaButton>
      <AriaPopover
        placement={isDesktop ? 'bottom start' : 'bottom'}
        triggerRef={triggerRef}
        offset={6}
        className={({ isEntering, isExiting }) =>
          cx(
            'w-[calc(var(--trigger-width)+1rem)] min-w-56 origin-(--trigger-anchor-point) will-change-transform',
            isEntering &&
              'duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5',
            isExiting &&
              'duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5',
          )
        }
      >
        <AriaDialog className="rounded-xl bg-primary p-1.5 shadow-lg ring-1 ring-secondary_alt outline-hidden">
          <p className="px-2 py-1.5 text-xs font-semibold text-tertiary">
            Switch company
          </p>
          <ul className="flex flex-col gap-0.5">
            {companies.map((company) => {
              const isSelected = company.id === companyId
              return (
                <li key={company.id}>
                  <button
                    type="button"
                    onClick={() => onCompanyChange(company.id)}
                    className={cx(
                      'relative flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-hidden transition duration-100 ease-linear',
                      'hover:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                      isSelected && 'bg-primary_hover',
                    )}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-fg-quaternary ring-1 ring-secondary ring-inset">
                      <Building07 className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-primary">
                        {company.name}
                      </span>
                    </span>
                    <RadioButtonBase
                      isSelected={isSelected}
                      className="shrink-0"
                    />
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-1 border-t border-secondary pt-1.5">
            <Button
              color="secondary"
              size="sm"
              iconLeading={Plus}
              className="w-full justify-center"
            >
              Add company
            </Button>
          </div>
        </AriaDialog>
      </AriaPopover>
    </AriaDialogTrigger>
  )
}
