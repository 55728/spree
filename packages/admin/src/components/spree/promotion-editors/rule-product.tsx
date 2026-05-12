import type { Product } from '@spree/admin-sdk'
import { useState } from 'react'
import { adminClient } from '@/client'
import { ResourceMultiAutocomplete } from '@/components/spree/resource-multi-autocomplete'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { EditorShell } from './editor-shell'
import { MatchPolicyPicker } from './match-policy-picker'
import type { PromotionRuleEditorContext } from './types'

type MatchPolicy = 'any' | 'all' | 'none'
const MATCH_POLICIES: readonly { value: MatchPolicy; label: string; description: string }[] = [
  { value: 'any', label: 'Any of these products', description: 'Order must contain at least one.' },
  {
    value: 'all',
    label: 'All of these products',
    description: 'Order must contain every product.',
  },
  {
    value: 'none',
    label: 'None of these products',
    description: 'Order must not contain any of them.',
  },
]

export function ProductRuleEditor({ draft, onSave, onClose }: PromotionRuleEditorContext) {
  const initialMatchPolicy = ((draft.preferences?.match_policy as MatchPolicy) ??
    'any') as MatchPolicy
  const [matchPolicy, setMatchPolicy] = useState<MatchPolicy>(
    MATCH_POLICIES.some((p) => p.value === initialMatchPolicy) ? initialMatchPolicy : 'any',
  )
  const [productIds, setProductIds] = useState<string[]>(draft.product_ids ?? [])
  const [products, setProducts] = useState<Product[]>(draft.products ?? [])

  function handleSave() {
    onSave({
      ...draft,
      preferences: { ...draft.preferences, match_policy: matchPolicy },
      product_ids: productIds,
      products,
    })
    onClose()
  }

  return (
    <EditorShell onSave={handleSave} onCancel={onClose} pending={false}>
      <MatchPolicyPicker policies={MATCH_POLICIES} value={matchPolicy} onChange={setMatchPolicy} />

      <FieldGroup>
        <Field>
          <FieldLabel>Products</FieldLabel>
          <ResourceMultiAutocomplete
            queryKey="promotion-rule-products"
            value={productIds}
            onChange={setProductIds}
            onResolvedOptionsChange={setProducts}
            search={(q) => adminClient.products.list({ name_cont: q, limit: 10, sort: 'name' })}
            hydrate={(ids) => adminClient.products.list({ id_in: ids, limit: ids.length })}
            getOptionLabel={(p) => p.name ?? p.id}
            placeholder="Search products by name…"
            emptyText="No products match"
          />
        </Field>
      </FieldGroup>
    </EditorShell>
  )
}
