import type { Category } from '@spree/admin-sdk'
import { useState } from 'react'
import { adminClient } from '@/client'
import { ResourceMultiAutocomplete } from '@/components/spree/resource-multi-autocomplete'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { EditorShell } from './editor-shell'
import { MatchPolicyPicker } from './match-policy-picker'
import type { PromotionRuleEditorContext } from './types'

type MatchPolicy = 'any' | 'all'
const MATCH_POLICIES: readonly { value: MatchPolicy; label: string; description: string }[] = [
  {
    value: 'any',
    label: 'Any of these categories',
    description: 'Order must contain a product in at least one.',
  },
  {
    value: 'all',
    label: 'All of these categories',
    description: 'Order must contain a product in every category.',
  },
]

/**
 * Surfaced as "Category(ies)" per the 6.0 Taxon→Category rename.
 * Backed by `Spree::Promotion::Rules::Taxon` until the table rename
 * ships; descendant categories match implicitly server-side.
 */
export function CategoryRuleEditor({ draft, onSave, onClose }: PromotionRuleEditorContext) {
  const initialMatchPolicy = ((draft.preferences?.match_policy as MatchPolicy) ?? 'any') as MatchPolicy
  const [matchPolicy, setMatchPolicy] = useState<MatchPolicy>(
    MATCH_POLICIES.some((p) => p.value === initialMatchPolicy) ? initialMatchPolicy : 'any',
  )
  const [categoryIds, setCategoryIds] = useState<string[]>(draft.category_ids ?? [])
  const [categories, setCategories] = useState<Category[]>(draft.categories ?? [])

  function handleSave() {
    onSave({
      ...draft,
      preferences: { ...draft.preferences, match_policy: matchPolicy },
      category_ids: categoryIds,
      categories,
    })
    onClose()
  }

  return (
    <EditorShell onSave={handleSave} onCancel={onClose} pending={false}>
      <MatchPolicyPicker policies={MATCH_POLICIES} value={matchPolicy} onChange={setMatchPolicy} />

      <FieldGroup>
        <Field>
          <FieldLabel>Categories</FieldLabel>
          <ResourceMultiAutocomplete
            queryKey="promotion-rule-categories"
            value={categoryIds}
            onChange={setCategoryIds}
            onResolvedOptionsChange={setCategories}
            search={(q) =>
              adminClient.categories.list({ name_cont: q, limit: 20, sort: 'pretty_name' })
            }
            hydrate={(ids) => adminClient.categories.list({ id_in: ids, limit: ids.length })}
            getOptionLabel={(c) => c.pretty_name ?? c.name ?? c.id}
            placeholder="Search categories…"
            emptyText="No categories match"
          />
        </Field>
      </FieldGroup>
    </EditorShell>
  )
}
