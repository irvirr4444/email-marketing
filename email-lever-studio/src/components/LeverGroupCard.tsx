import { LockIcon } from './LockIcon'

type LeverGroupCardProps = {
  title: string
  reasoning: string
  locked: boolean
  onToggleLock: () => void
  flash?: boolean
  staggerIndex?: number
  disabled?: boolean
  children: React.ReactNode
}

export function LeverGroupCard({
  title,
  reasoning,
  locked,
  onToggleLock,
  flash,
  staggerIndex = 0,
  disabled,
  children,
}: LeverGroupCardProps) {
  return (
    <div
      className={`fade-in rounded-xl border bg-white p-5 transition-all duration-150 hover:border-[#d4d2cc] ${
        flash ? 'lock-flash border-[#4f46e5]/40' : 'border-[#e5e3de]'
      } ${locked ? 'ring-1 ring-[#4f46e5]/20' : ''}`}
      style={{ animationDelay: `${staggerIndex * 30}ms`, opacity: 0 }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[#1a1a18]">{title}</h3>
          <p className="mt-1 text-[13px] italic text-[#6b6960]">
            AI: {reasoning}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleLock}
          disabled={disabled}
          title={locked ? 'Unlock card' : 'Lock card'}
          className={`shrink-0 rounded-md p-1.5 transition-colors duration-150 disabled:opacity-50 ${
            locked
              ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
              : 'text-[#6b6960] hover:bg-[#fafaf8]'
          }`}
        >
          <LockIcon locked={locked} className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
