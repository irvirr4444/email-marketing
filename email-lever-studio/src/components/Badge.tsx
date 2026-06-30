type BadgeProps = {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[#e5e3de] bg-white px-2.5 py-1 text-[13px] font-medium text-[#1a1a18] ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#6b6960]" aria-hidden />
      {children}
    </span>
  )
}
