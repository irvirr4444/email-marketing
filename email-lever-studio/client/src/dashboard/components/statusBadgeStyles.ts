export const STATUS_BADGE_CLASS =
  'h-[26px] min-w-[5rem] justify-center rounded-md px-2.5 !py-0 text-xs font-medium leading-none *:data-icon:size-3.5 *:data-icon:shrink-0 *:data-icon:stroke-[2px]'

export const STATUS_FILTER_SELECTED_CLASS: Record<
  'gray' | 'orange' | 'success',
  string
> = {
  gray:
    'opacity-100 ring-2 ring-utility-neutral-400 ring-offset-1 shadow-[0_0_0_4px_var(--color-utility-neutral-100),0_0_12px_0_var(--color-utility-neutral-200)]',
  orange:
    'opacity-100 ring-2 ring-utility-orange-400 ring-offset-1 shadow-[0_0_0_4px_var(--color-utility-orange-100),0_0_12px_0_var(--color-utility-orange-200)]',
  success:
    'opacity-100 ring-2 ring-utility-green-400 ring-offset-1 shadow-[0_0_0_4px_var(--color-utility-green-100),0_0_12px_0_var(--color-utility-green-200)]',
}
