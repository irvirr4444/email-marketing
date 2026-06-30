import { useEffect, useRef, useState } from 'react'
import type { OptionDef } from '../../shared/schema.ts'

type SegmentedControlProps = {
  options: OptionDef[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  compact?: boolean
}

export function SegmentedControl({
  options,
  value,
  onChange,
  disabled,
  compact,
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [highlight, setHighlight] = useState({ left: 0, width: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const activeIndex = options.findIndex((o) => o.value === value)
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    const btn = buttons[activeIndex]
    if (!btn) return

    setHighlight({
      left: btn.offsetLeft,
      width: btn.offsetWidth,
    })
  }, [value, options])

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex flex-wrap rounded-lg border border-[#e5e3de] bg-[#fafaf8] p-0.5 ${
        compact ? 'text-xs' : 'text-[13px]'
      }`}
    >
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md bg-[#4f46e5] transition-all duration-150 ease-out"
        style={{
          left: highlight.left,
          width: highlight.width,
        }}
        aria-hidden
      />
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`relative z-10 rounded-md px-2 py-1 font-medium transition-colors duration-150 ease-out disabled:opacity-50 ${
              active ? 'text-white' : 'text-[#1a1a18] hover:text-[#4f46e5]'
            } ${compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'}`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
