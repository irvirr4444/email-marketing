import { useEffect, useRef, useState } from 'react'
import { MaterialIcon } from './MaterialIcon'

const STEPS = [
  { id: 'section-recipient', label: 'Recipient' },
  { id: 'section-relationship', label: 'Relationship' },
  { id: 'section-intent', label: 'Intent' },
  { id: 'section-style', label: 'Style' },
] as const

const SCROLL_OFFSET = 96

function getActiveIndex(sections: HTMLElement[]): number {
  let active = 0
  for (let i = 0; i < sections.length; i++) {
    const top = sections[i].getBoundingClientRect().top
    if (top <= SCROLL_OFFSET) active = i
  }
  return active
}

function getSectionProgress(section: HTMLElement): number {
  const viewport = window.innerHeight - SCROLL_OFFSET
  const rect = section.getBoundingClientRect()
  const scrolled = SCROLL_OFFSET - rect.top
  const total = rect.height - viewport
  if (total <= 0) return rect.top <= SCROLL_OFFSET ? 1 : 0
  return Math.min(1, Math.max(0, scrolled / total))
}

export function StepRail() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sectionProgress, setSectionProgress] = useState(0)
  const [fabOpen, setFabOpen] = useState(false)
  const rafRef = useRef<number>(0)
  const currentIndexRef = useRef(0)

  useEffect(() => {
    const sections = STEPS.map((s) => document.getElementById(s.id)).filter(
      Boolean,
    ) as HTMLElement[]

    if (sections.length === 0) return

    function update() {
      const nextIndex = getActiveIndex(sections)
      currentIndexRef.current = nextIndex
      setCurrentIndex(nextIndex)
      setSectionProgress(getSectionProgress(sections[nextIndex]))
    }

    function onScroll() {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  function scrollToStep(id: string) {
    setFabOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <nav className="step-rail" aria-label="Page sections">
        <div className="step-rail-list">
          {STEPS.map((step, i) => {
            const isCurrent = i === currentIndex
            const isCompleted = i < currentIndex
            const isLast = i === STEPS.length - 1

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
          {STEPS.map((step, i) => (
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
