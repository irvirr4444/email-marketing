import { useEffect, useMemo, useRef, useState } from 'react'
import { MaterialIcon } from './MaterialIcon'

const BASE_STEPS = [
  { id: 'section-recipient', label: 'Recipient' },
  { id: 'section-draft', label: 'Draft' },
  { id: 'section-intent', label: 'Intent' },
  { id: 'section-style', label: 'Style' },
] as const

type StepRailProps = {
  showDraftStep?: boolean
}

export function StepRail({ showDraftStep = false }: StepRailProps) {
  const steps = useMemo(
    () =>
      showDraftStep
        ? [...BASE_STEPS]
        : BASE_STEPS.filter((s) => s.id !== 'section-draft'),
    [showDraftStep],
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sectionProgress, setSectionProgress] = useState(0)
  const [fabOpen, setFabOpen] = useState(false)
  const rafRef = useRef<number>(0)
  const ratiosRef = useRef<number[]>([0, 0, 0, 0])
  const currentIndexRef = useRef(0)

  useEffect(() => {
    ratiosRef.current = new Array(steps.length).fill(0)
    currentIndexRef.current = 0
    setCurrentIndex(0)
    setSectionProgress(0)

    const sections = steps.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[]

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = sections.indexOf(entry.target as HTMLElement)
          if (idx >= 0) ratiosRef.current[idx] = entry.intersectionRatio
        })

        cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          let bestIdx = 0
          let bestRatio = 0
          ratiosRef.current.forEach((r, i) => {
            if (r > bestRatio) {
              bestRatio = r
              bestIdx = i
            }
          })
          currentIndexRef.current = bestIdx
          setCurrentIndex(bestIdx)
        })
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-80px 0px -40% 0px' },
    )

    sections.forEach((el) => observer.observe(el))

    function onScroll() {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const el = sections[currentIndexRef.current]
        if (!el) return
        const rect = el.getBoundingClientRect()
        const viewport = window.innerHeight - 80
        const scrolled = 80 - rect.top
        const total = rect.height - viewport
        const progress = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0
        setSectionProgress(progress)
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [steps])

  function scrollToStep(id: string) {
    setFabOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav className="step-rail" aria-label="Page sections">
        <div className="step-rail-list">
          {steps.map((step, i) => {
            const isCurrent = i === currentIndex
            const isCompleted = i < currentIndex
            const isLast = i === steps.length - 1

            return (
              <button
                key={step.id}
                type="button"
                className="step-rail-item"
                onClick={() => scrollToStep(step.id)}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <div className="step-rail-dot-wrap">
                  <span
                    className={`step-rail-dot ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
                  />
                  {!isLast && (
                    <span className="step-rail-line" aria-hidden>
                      <span
                        className="step-rail-line-fill"
                        style={{
                          transform: `scaleY(${
                            i < currentIndex
                              ? 1
                              : i === currentIndex
                                ? sectionProgress
                                : 0
                          })`,
                        }}
                      />
                    </span>
                  )}
                </div>
                <span
                  className={`step-rail-label ${isCurrent ? 'current' : ''}`}
                >
                  {step.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <button
        type="button"
        className="step-rail-fab"
        onClick={() => setFabOpen((o) => !o)}
        aria-label="Jump to section"
        aria-expanded={fabOpen}
      >
        <MaterialIcon name="format_list_bulleted" size={22} />
      </button>

      {fabOpen && (
        <div className="step-rail-fab-menu" role="menu">
          {steps.map((step, i) => (
            <button
              key={step.id}
              type="button"
              role="menuitem"
              className={`step-rail-fab-item ${i === currentIndex ? 'current' : ''}`}
              onClick={() => scrollToStep(step.id)}
            >
              {step.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
