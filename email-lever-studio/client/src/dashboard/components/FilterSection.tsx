import type { ReactNode } from 'react'
import { cx } from '@/utils/cx'

export function FilterSection({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tertiary">
      {title}
    </p>
  )
}

export function FilterSectionBlock({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('flex flex-col gap-2', className)}>
      <FilterSection title={title} />
      {children}
    </section>
  )
}
