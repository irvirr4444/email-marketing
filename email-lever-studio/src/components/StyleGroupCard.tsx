import { LockButton } from './LockButton'
import { MaterialIcon } from './MaterialIcon'

export type CardVariant = 'primary' | 'supporting'

type StyleGroupCardProps = {
  title: string
  reasoning: string
  locked: boolean
  highlightLocked?: boolean
  showReasoning?: boolean
  showLock?: boolean
  subdued?: boolean
  disabled?: boolean
  variant?: CardVariant
  onToggleLock: () => void
  children: React.ReactNode
}

const PADDING: Record<CardVariant, string> = {
  primary: 'p-5',
  supporting: 'p-4',
}

export function StyleGroupCard({
  title,
  reasoning,
  locked,
  highlightLocked = false,
  showReasoning = true,
  showLock = true,
  subdued = false,
  disabled,
  variant = 'supporting',
  onToggleLock,
  children,
}: StyleGroupCardProps) {
  const isPrimary = variant === 'primary'

  const surfaceClass = subdued
    ? 'card-idle'
    : isPrimary
      ? 'card-primary'
      : 'card-supporting'

  return (
    <div
      className={`h-fit ${PADDING[variant]} ${surfaceClass} ${highlightLocked ? 'card-locked' : ''}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-medium text-[var(--on-surface)]">
            {title}
          </h3>
          {showReasoning && reasoning && (
            <p className="mt-0.5 line-clamp-2 flex items-start gap-1 text-[12px] leading-snug text-[var(--on-surface-variant)]">
              <MaterialIcon
                name="auto_awesome"
                size={14}
                className="ai-reasoning-icon mt-0.5 shrink-0"
              />
              <span>{reasoning}</span>
            </p>
          )}
        </div>
        {showLock && (
          <LockButton
            locked={locked}
            disabled={disabled}
            onClick={onToggleLock}
          />
        )}
      </div>
      {children}
    </div>
  )
}
