import {
  COUNTRIES,
  countryCodeToFlag,
  type Country,
} from '../../shared/countries.ts'
import { AutocompleteField } from './AutocompleteField'

type CountryFieldProps = {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
}

function renderCountry(c: Country) {
  return (
    <>
      <span className="text-base leading-none" aria-hidden>
        {countryCodeToFlag(c.code)}
      </span>
      <span>{c.name}</span>
      <span className="ml-auto text-[var(--on-surface-variant)]">{c.code}</span>
    </>
  )
}

export function CountryField({ value, onChange, disabled }: CountryFieldProps) {
  return (
    <AutocompleteField
      items={COUNTRIES}
      value={value}
      onChange={onChange}
      disabled={disabled}
      label="Country"
      getLabel={(c) => c.name}
      getSearchText={(c) => `${c.name} ${c.code}`}
      renderOption={(c) => (
        <span className="flex w-full items-center gap-2">{renderCountry(c)}</span>
      )}
    />
  )
}
