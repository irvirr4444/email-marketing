import { useEffect, useRef, useState } from 'react'
import {
  CUSTOMER_SEGMENT_OPTIONS,
  labelForSegment,
  type CustomerSegment,
} from '../../shared/schema.ts'

type SegmentSelectProps = {
  value: CustomerSegment
  onChange: (value: CustomerSegment) => void
  disabled?: boolean
}

export function SegmentSelect({ value, onChange, disabled }: SegmentSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(
    CUSTOMER_SEGMENT_OPTIONS.indexOf(value),
  )

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  useEffect(() => {
    setHighlightIndex(CUSTOMER_SEGMENT_OPTIONS.indexOf(value))
  }, [value, open])

  function selectAt(index: number) {
    const seg = CUSTOMER_SEGMENT_OPTIONS[index]
    if (seg) {
      onChange(seg)
      setOpen(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return

    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) =>
        Math.min(i + 1, CUSTOMER_SEGMENT_OPTIONS.length - 1),
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectAt(highlightIndex)
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-[#e5e3de] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1a1a18] transition-colors duration-150 hover:border-[#d4d2cc] focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 disabled:opacity-50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#6b6960]" aria-hidden />
        Segment: {labelForSegment(value)} · First Touch
        <svg
          className={`h-3.5 w-3.5 text-[#6b6960] transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1 min-w-[220px] max-h-64 overflow-y-auto rounded-lg border border-[#e5e3de] bg-white py-1 shadow-md"
        >
          {CUSTOMER_SEGMENT_OPTIONS.map((seg, index) => {
            const selected = seg === value
            const highlighted = index === highlightIndex
            return (
              <li key={seg}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setHighlightIndex(index)}
                  onClick={() => selectAt(index)}
                  className={`w-full px-3 py-2 text-left text-[13px] transition-colors duration-150 ${
                    highlighted || selected
                      ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
                      : 'text-[#1a1a18] hover:bg-[#4f46e5]/10'
                  }`}
                >
                  {labelForSegment(seg)}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
