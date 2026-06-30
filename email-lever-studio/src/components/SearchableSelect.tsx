import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

export type SearchableSelectProps<T> = {
  items: T[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  getLabel: (item: T) => string
  getSearchText: (item: T) => string
  renderOption?: (item: T, selected: boolean, highlighted: boolean) => ReactNode
  renderTriggerValue?: (item: T | null) => ReactNode
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}

export function SearchableSelect<T>({
  items,
  value,
  onChange,
  getLabel,
  getSearchText,
  renderOption,
  renderTriggerValue,
  placeholder = 'Select…',
  clearable = true,
  disabled,
}: SearchableSelectProps<T>) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)

  const selectedItem =
    value != null ? items.find((item) => getLabel(item) === value) : undefined

  const filtered = items.filter((item) =>
    getSearchText(item).toLowerCase().includes(query.trim().toLowerCase()),
  )

  useEffect(() => {
    if (!open) return
    setHighlightIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  function selectItem(item: T) {
    onChange(getLabel(item))
    setOpen(false)
    setQuery('')
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
      setQuery('')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[highlightIndex]) {
      e.preventDefault()
      selectItem(filtered[highlightIndex])
    }
  }

  return (
    <div ref={rootRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((o) => !o)
          if (!open) setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#e5e3de] bg-white px-3 py-2 text-left text-[15px] shadow-sm transition-colors duration-150 hover:border-[#d4d2cc] focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15 disabled:opacity-50"
      >
        <span className="min-w-0 flex-1 truncate text-[#1a1a18]">
          {selectedItem
            ? renderTriggerValue?.(selectedItem) ?? getLabel(selectedItem)
            : <span className="text-[#6b6960]/60">{placeholder}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {clearable && selectedItem && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
                setQuery('')
              }}
              className="rounded p-0.5 text-[#6b6960] hover:bg-[#fafaf8] hover:text-[#1a1a18]"
              aria-label="Clear"
            >
              ×
            </span>
          )}
          <svg
            className={`h-4 w-4 text-[#6b6960] transition-transform ${open ? 'rotate-180' : ''}`}
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
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[#e5e3de] bg-white shadow-md">
          <div className="border-b border-[#e5e3de] p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              className="w-full rounded-md border border-[#e5e3de] bg-[#fafaf8] px-2.5 py-1.5 text-[13px] focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/15"
              aria-controls={listId}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[13px] text-[#6b6960]">No matches</li>
            ) : (
              filtered.map((item, index) => {
                const selected = getLabel(item) === value
                const highlighted = index === highlightIndex
                return (
                  <li key={getLabel(item) + getSearchText(item)}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onMouseEnter={() => setHighlightIndex(index)}
                      onClick={() => selectItem(item)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors duration-150 ${
                        highlighted || selected
                          ? 'bg-[#4f46e5]/10 text-[#4f46e5]'
                          : 'text-[#1a1a18] hover:bg-[#4f46e5]/10'
                      }`}
                    >
                      {renderOption?.(item, selected, highlighted) ?? getLabel(item)}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
