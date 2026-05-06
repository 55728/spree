import type {
  CustomFieldCreateParams,
  CustomFieldDefinitionCreateParams,
  CustomFieldDefinitionUpdateParams,
  CustomFieldOwnerType,
  CustomFieldUpdateParams,
} from '@spree/admin-sdk'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminClient } from '@/client'

const valuesKey = (ownerType: CustomFieldOwnerType, ownerId: string) =>
  ['custom-fields', ownerType, ownerId] as const

const definitionsKey = (resourceType: string) => ['custom-field-definitions', resourceType] as const

export function useCustomFields(ownerType: CustomFieldOwnerType, ownerId: string) {
  return useQuery({
    queryKey: valuesKey(ownerType, ownerId),
    queryFn: () => adminClient.customFields(ownerType, ownerId).list({ limit: 100 }),
    enabled: !!ownerId,
  })
}

export function useCustomFieldDefinitions(resourceType: string) {
  return useQuery({
    queryKey: definitionsKey(resourceType),
    queryFn: () =>
      adminClient.customFieldDefinitions.list({
        limit: 100,
        resource_type_eq: resourceType,
      }),
    enabled: !!resourceType,
  })
}

export function useCreateCustomField(ownerType: CustomFieldOwnerType, ownerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CustomFieldCreateParams) =>
      adminClient.customFields(ownerType, ownerId).create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuesKey(ownerType, ownerId) })
    },
  })
}

export function useUpdateCustomField(ownerType: CustomFieldOwnerType, ownerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...params }: { id: string } & CustomFieldUpdateParams) =>
      adminClient.customFields(ownerType, ownerId).update(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuesKey(ownerType, ownerId) })
    },
  })
}

export function useDeleteCustomField(ownerType: CustomFieldOwnerType, ownerId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminClient.customFields(ownerType, ownerId).delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: valuesKey(ownerType, ownerId) })
    },
  })
}

export function useCreateCustomFieldDefinition(resourceType: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CustomFieldDefinitionCreateParams) =>
      adminClient.customFieldDefinitions.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: definitionsKey(resourceType) })
    },
  })
}

export function useUpdateCustomFieldDefinition(resourceType: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...params }: { id: string } & CustomFieldDefinitionUpdateParams) =>
      adminClient.customFieldDefinitions.update(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: definitionsKey(resourceType) })
    },
  })
}

export function useDeleteCustomFieldDefinition(resourceType: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => adminClient.customFieldDefinitions.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: definitionsKey(resourceType) })
    },
  })
}
