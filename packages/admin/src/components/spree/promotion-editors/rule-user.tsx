import type { Customer } from '@spree/admin-sdk'
import { useState } from 'react'
import { adminClient } from '@/client'
import { ResourceMultiAutocomplete } from '@/components/spree/resource-multi-autocomplete'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { EditorShell } from './editor-shell'
import type { PromotionRuleEditorContext } from './types'

export function UserRuleEditor({ draft, onSave, onClose }: PromotionRuleEditorContext) {
  const [userIds, setUserIds] = useState<string[]>(draft.user_ids ?? [])
  const [customers, setCustomers] = useState<Customer[]>(draft.customers ?? [])

  function handleSave() {
    onSave({ ...draft, user_ids: userIds, customers })
    onClose()
  }

  return (
    <EditorShell onSave={handleSave} onCancel={onClose} pending={false}>
      <FieldGroup>
        <Field>
          <FieldLabel>Customers</FieldLabel>
          <ResourceMultiAutocomplete
            queryKey="promotion-rule-users"
            value={userIds}
            onChange={setUserIds}
            onResolvedOptionsChange={setCustomers}
            search={(q) => adminClient.customers.list({ search: q, limit: 10 })}
            hydrate={(ids) => adminClient.customers.list({ id_in: ids, limit: ids.length })}
            getOptionLabel={(c) => c.full_name || c.email || c.id}
            placeholder="Search customers by name or email…"
            emptyText="No customers match"
          />
        </Field>
      </FieldGroup>
    </EditorShell>
  )
}
