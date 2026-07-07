import { useRef, useState } from 'react'
import {
  Building07,
  ChevronSelectorVertical,
  Plus,
  Settings01,
} from '@untitledui/icons'
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
import AddCompanyDialog from './AddCompanyDialog'

type Props = {
  companies: Company[]
  companyId: string
  onCompanyChange: (companyId: string) => void
  onAddCompany: (
    name: string,
  ) => Promise<{ ok: true; companyId: string } | { ok: false; error: string }>
}

export default function CompanySwitcher({
  companies,
  companyId,
  onCompanyChange,
  onAddCompany,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isDesktop = useBreakpoint('lg')
  const [addOpen, setAddOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const selected =
    companies.find((company) => company.id === companyId) ?? companies[0]

  if (!selected) return null

  const handleAddCompany = async (name: string) => {
    const result = await onAddCompany(name)
    if (result.ok) {
      setPopoverOpen(false)
      onCompanyChange(result.companyId)
      return { ok: true as const }
    }
    return { ok: false as const, error: result.error }
  }

  return (
    <>
      <AriaDialogTrigger isOpen={popoverOpen} onOpenChange={setPopoverOpen}>
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
          <AriaDialog className="w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden">
            <div className="rounded-xl bg-primary ring-1 ring-secondary">
              <div className="flex flex-col gap-0.5 border-b border-secondary py-1.5">
                <div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-tertiary">
                  Switch company
                </div>
                <ul className="flex flex-col gap-0.5 px-1.5">
                  {companies.map((company) => {
                    const isSelected = company.id === companyId
                    return (
                      <li key={company.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onCompanyChange(company.id)
                            setPopoverOpen(false)
                          }}
                          className={cx(
                            'relative w-full cursor-pointer rounded-md px-2 py-1.5 text-left outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                            isSelected && 'bg-primary_hover',
                            !isSelected && 'hover:bg-primary_hover',
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2.5 pr-8">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-fg-quaternary ring-1 ring-secondary ring-inset">
                              <Building07 className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-primary">
                                {company.name}
                              </span>
                              <span className="block truncate text-xs text-tertiary">
                                Company workspace
                              </span>
                            </span>
                          </span>
                          <RadioButtonBase
                            isSelected={isSelected}
                            className="absolute top-2 right-2"
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="flex flex-col gap-2 px-2 py-2">
                <Button
                  color="secondary"
                  size="sm"
                  iconLeading={Plus}
                  className="w-full justify-center"
                  onClick={() => {
                    setPopoverOpen(false)
                    setAddOpen(true)
                  }}
                >
                  Add company
                </Button>
              </div>
            </div>

            <div className="pt-1 pb-1.5">
              <Button
                color="tertiary"
                size="sm"
                iconLeading={Settings01}
                className="w-full justify-center"
              >
                Company settings
              </Button>
            </div>
          </AriaDialog>
        </AriaPopover>
      </AriaDialogTrigger>

      <AddCompanyDialog
        isOpen={addOpen}
        onOpenChange={setAddOpen}
        onConfirm={handleAddCompany}
      />
    </>
  )
}
