import type { Country } from '@spree/admin-sdk'
import { useState } from 'react'
import { adminClient } from '@/client'
import { ResourceMultiAutocomplete } from '@/components/spree/resource-multi-autocomplete'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { EditorShell } from './editor-shell'
import type { PromotionRuleEditorContext } from './types'

/**
 * Stores ISO codes — the `Country` resource has no numeric id, so its
 * primary key is `iso`. The autocomplete contract requires `{id: string}`,
 * so we project ISO onto `id` for the picker and round-trip it through
 * the rule's `country_isos` preference.
 */
export function CountryRuleEditor({ draft, onSave, onClose }: PromotionRuleEditorContext) {
  const [countryIsos, setCountryIsos] = useState<string[]>(() =>
    ((draft.preferences?.country_isos ?? []) as string[]).map((s) => s.toUpperCase()),
  )
  const [countries, setCountries] = useState<Country[]>(draft.countries ?? [])

  function handleSave() {
    onSave({
      ...draft,
      preferences: { ...draft.preferences, country_isos: countryIsos },
      countries,
    })
    onClose()
  }

  return (
    <EditorShell onSave={handleSave} onCancel={onClose} pending={false}>
      <FieldGroup>
        <Field>
          <FieldLabel>Countries</FieldLabel>
          <ResourceMultiAutocomplete<CountryOption>
            queryKey="promotion-rule-countries"
            value={countryIsos}
            onChange={setCountryIsos}
            onResolvedOptionsChange={(options) => setCountries(options.map(fromOption))}
            search={async (q) => {
              const result = await adminClient.countries.list({
                name_cont: q,
                limit: 20,
                sort: 'name',
              })
              return { data: result.data.map(toOption) }
            }}
            hydrate={async (isos) => {
              const result = await adminClient.countries.list({
                iso_in: isos,
                limit: isos.length,
              })
              return { data: result.data.map(toOption) }
            }}
            getOptionLabel={(c) => `${c.name} (${c.id})`}
            placeholder="Search countries…"
            emptyText="No countries match"
          />
        </Field>
      </FieldGroup>
    </EditorShell>
  )
}

type CountryOption = { id: string; name: string; raw: Country }

function toOption(country: Country): CountryOption {
  return { id: country.iso, name: country.name, raw: country }
}

function fromOption(option: CountryOption): Country {
  return option.raw
}
