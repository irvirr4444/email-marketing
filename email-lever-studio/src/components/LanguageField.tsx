import { LANGUAGES } from '../../shared/languages.ts'
import { AutocompleteField } from './AutocompleteField'

type LanguageFieldProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

export function LanguageField({
  value,
  onChange,
  disabled,
}: LanguageFieldProps) {
  return (
    <AutocompleteField
      items={LANGUAGES}
      value={value}
      onChange={onChange}
      disabled={disabled}
      label="Language"
      getLabel={(l) => l.name}
      getSearchText={(l) => `${l.name} ${l.code}`}
      renderOption={(l) => (
        <span className="flex w-full items-center gap-2">
          <span>{l.name}</span>
          <span className="ml-auto text-[var(--on-surface-variant)]">
            {l.code}
          </span>
        </span>
      )}
    />
  )
}
