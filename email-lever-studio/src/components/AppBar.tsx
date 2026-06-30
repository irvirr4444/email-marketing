import { useEffect, useRef, useState } from 'react'

type AppBarProps = {
  loadingLevers: boolean
  loadingDraft: boolean
  canGenerate: boolean
  hasDraft: boolean
  onGenerate: () => void
}

export function AppBar({
  loadingLevers,
  loadingDraft,
  canGenerate,
  hasDraft,
  onGenerate,
}: AppBarProps) {
  const barRef = useRef<HTMLElement>(null)
  const [elevated, setElevated] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    function onScroll() {
      setElevated(window.scrollY > 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const statusText = loadingLevers
    ? 'Suggesting…'
    : loadingDraft
      ? 'Drafting…'
      : null

  const buttonLabel = hasDraft ? 'Regenerate email' : 'Generate email'
  const disabled = !canGenerate || loadingLevers || loadingDraft

  return (
    <header
      ref={barRef}
      className={`app-bar sticky top-0 z-50 h-16 bg-[var(--surface)] ${elevated ? 'elevated' : ''}`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-6">
        <div>
          <h1 className="font-display text-[20px] font-bold text-[var(--on-surface)]">
            Lever
          </h1>
          <p className="hidden text-[12px] text-[var(--on-surface-variant)] sm:block">
            Cold Outreach · Email 1
          </p>
        </div>

        <div className="flex items-center gap-4">
          {statusText && (
            <span className="hidden text-[13px] text-[var(--on-surface-variant)] sm:inline">
              {statusText}
            </span>
          )}

          <div
            className="relative"
            onMouseEnter={() => !canGenerate && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => !canGenerate && setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
          >
            <button
              type="button"
              onClick={onGenerate}
              disabled={disabled}
              className="m-ripple rounded-full bg-[var(--primary)] px-6 py-2.5 text-[14px] font-medium text-[var(--on-primary)] transition-opacity disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,var(--on-surface)_12%,transparent)] disabled:text-[color-mix(in_srgb,var(--on-surface)_38%,transparent)]"
            >
              {buttonLabel}
            </button>
            {showTooltip && !canGenerate && (
              <div
                role="tooltip"
                className="elevation-2 absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-[var(--on-surface)] px-3 py-2 text-[12px] text-[var(--surface)]"
              >
                Add a name and email to generate.
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
