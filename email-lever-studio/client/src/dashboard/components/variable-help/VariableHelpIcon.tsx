import { HelpCircle } from '@untitledui/icons'
import {
  Tooltip,
  TooltipTrigger,
} from '@ui/components/base/tooltip/tooltip'
import type { VariableHelpMeta } from './resolveVariableMetadata'

type Props = {
  label: string
  help: VariableHelpMeta | null
}

export default function VariableHelpIcon({ label, help }: Props) {
  if (!help) return null

  const description = help.designNote
    ? `${help.whatItIs} ${help.designNote}`
    : help.whatItIs

  return (
    <Tooltip title={label} description={description} placement="top">
      <TooltipTrigger
        aria-label={`What is ${label}?`}
        className="shrink-0 cursor-pointer rounded-full text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover"
      >
        <HelpCircle className="size-4 stroke-[2.25px]" />
      </TooltipTrigger>
    </Tooltip>
  )
}
