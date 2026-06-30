import { LANGUAGES } from '../../shared/languages.ts'
import { SearchableSelect } from './SearchableSelect'

type LanguageSelectProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

export function LanguageSelect({
  value,
  onChange,
  disabled,
}: LanguageSelectProps) {
  return (
    <SearchableSelect
      items={LANGUAGES}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select language…"
      getLabel={(l) => l.name}
      getSearchText={(l) => `${l.name} ${l.code}`}
      renderTriggerValue={(l) =>
        l ? (
          <span className="inline-flex items-center gap-2">
            <span>{l.name}</span>
            <span className="text-[#6b6960]">{l.code}</span>
          </span>
        ) : null
      }
      renderOption={(l) => (
        <span className="flex w-full items-center gap-2">
          <span>{l.name}</span>
          <span className="ml-auto text-[#6b6960]">{l.code}</span>
        </span>
      )}
    />
  )
}
