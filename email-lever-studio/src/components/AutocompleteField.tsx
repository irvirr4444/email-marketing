import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { MaterialIcon } from './MaterialIcon'

export type AutocompleteFieldProps<T> = {
  items: T[]
  value: string | undefined
  onChange: (value: string | undefined) => void
  getLabel: (item: T) => string
  getSearchText: (item: T) => string
  renderOption?: (item: T, selected: boolean, highlighted: boolean) => ReactNode
  renderValue?: (item: T | null) => ReactNode
  label: string
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
}

export function AutocompleteField<T>({
  items,
  value,
  onChange,
  getLabel,
  getSearchText,
  renderOption,
  renderValue,
  label,
  clearable = true,
  disabled,
}: AutocompleteFieldProps<T>) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [focused, setFocused] = useState(false)

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
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
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

  const hasValue = Boolean(selectedItem || query)

  return (
    <div ref={rootRef} className="relative m-outlined-field" onKeyDown={handleKeyDown}>
      <div className={`relative ${hasValue || focused ? 'has-value' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={open ? query : (selectedItem ? getLabel(selectedItem) : '')}
          placeholder=" "
          onFocus={() => {
            setFocused(true)
            setOpen(true)
            if (selectedItem) setQuery('')
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            if (!e.target.value) onChange(undefined)
          }}
          className="pr-10"
        />
        <label>{label}</label>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--on-surface-variant)]">
          <MaterialIcon name="arrow_drop_down" size={24} />
        </span>
      </div>

      {open && (
        <div className="elevation-2 absolute z-50 mt-1 w-full rounded-lg bg-[var(--surface)] py-1">
          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-[13px] text-[var(--on-surface-variant)]">
                No matches
              </li>
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
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-[13px] transition-colors ${
                        highlighted
                          ? 'bg-[var(--surface-container-high)]'
                          : 'hover:bg-[var(--surface-container)]'
                      }`}
                    >
                      {renderOption?.(item, selected, highlighted) ??
                        getLabel(item)}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
          {clearable && selectedItem && !disabled && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined)
                setQuery('')
              }}
              className="w-full border-t border-[var(--outline-variant)] px-4 py-2 text-left text-[13px] text-[var(--primary)] hover:bg-[var(--surface-container)]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {!open && selectedItem && renderValue && (
        <div className="pointer-events-none absolute left-12 top-4 text-[15px]">
          {renderValue(selectedItem)}
        </div>
      )}
    </div>
  )
}
