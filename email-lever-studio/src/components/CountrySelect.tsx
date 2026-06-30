import {
  COUNTRIES,
  countryCodeToFlag,
  type Country,
} from '../../shared/countries.ts'
import { SearchableSelect } from './SearchableSelect'

type CountrySelectProps = {
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
      <span className="ml-auto text-[#6b6960]">{c.code}</span>
    </>
  )
}

export function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  return (
    <SearchableSelect
      items={COUNTRIES}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder="Select country…"
      getLabel={(c) => c.name}
      getSearchText={(c) => `${c.name} ${c.code}`}
      renderTriggerValue={(c) =>
        c ? (
          <span className="inline-flex items-center gap-2">
            <span>{countryCodeToFlag(c.code)}</span>
            <span>{c.name}</span>
          </span>
        ) : null
      }
      renderOption={(c) => (
        <span className="flex w-full items-center gap-2">{renderCountry(c)}</span>
      )}
    />
  )
}
