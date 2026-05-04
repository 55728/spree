import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateCustomFieldDefinition } from '@/hooks/use-custom-fields'

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'rich_text', label: 'Rich text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'json', label: 'JSON' },
] as const

const definitionSchema = z.object({
  label: z.string().min(1, 'Required'),
  namespace: z.string().min(1, 'Required'),
  key: z
    .string()
    .min(1, 'Required')
    .regex(/^[a-z0-9_]+$/i, 'Letters, numbers, underscore only'),
  field_type: z.enum(['short_text', 'long_text', 'rich_text', 'number', 'boolean', 'json']),
  storefront_visible: z.boolean(),
})

export type DefinitionFormValues = z.infer<typeof definitionSchema>

interface DefinitionFormProps {
  resourceType: string
  /** Default namespace; "custom" mirrors Shopify/Saleor convention. */
  defaultNamespace?: string
  onSuccess: (definitionId: string) => void
  /**
   * Render-prop that builds the surrounding chrome (header/footer/etc) AROUND
   * the form fields and the submit button. The submit button must stay inside
   * the same `<form>` as the inputs, so the consumer composes layout, not the
   * form element itself.
   */
  renderShell: (parts: { fields: ReactNode; submitButton: ReactNode }) => ReactNode
}

export function DefinitionForm({
  resourceType,
  defaultNamespace = 'custom',
  onSuccess,
  renderShell,
}: DefinitionFormProps) {
  const create = useCreateCustomFieldDefinition(resourceType)

  const form = useForm<DefinitionFormValues>({
    resolver: zodResolver(definitionSchema),
    defaultValues: {
      label: '',
      namespace: defaultNamespace,
      key: '',
      field_type: 'short_text',
      storefront_visible: false,
    },
  })

  const onSubmit = async (values: DefinitionFormValues) => {
    try {
      const result = await create.mutateAsync({ ...values, resource_type: resourceType })
      onSuccess(result.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create definition'
      form.setError('root', { message })
    }
  }

  const fields = (
    <div className="flex flex-col gap-4">
      {form.formState.errors.root && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {form.formState.errors.root.message}
        </div>
      )}

      <Field>
        <FieldLabel htmlFor="label">Label</FieldLabel>
        <Input id="label" placeholder="e.g. Material" {...form.register('label')} />
        {form.formState.errors.label && (
          <p className="text-xs text-destructive">{form.formState.errors.label.message}</p>
        )}
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field className="col-span-1">
          <FieldLabel htmlFor="namespace">Namespace</FieldLabel>
          <Input id="namespace" placeholder="custom" {...form.register('namespace')} />
          {form.formState.errors.namespace && (
            <p className="text-xs text-destructive">{form.formState.errors.namespace.message}</p>
          )}
        </Field>
        <Field className="col-span-2">
          <FieldLabel htmlFor="key">Key</FieldLabel>
          <Input id="key" placeholder="e.g. material" {...form.register('key')} />
          {form.formState.errors.key && (
            <p className="text-xs text-destructive">{form.formState.errors.key.message}</p>
          )}
        </Field>
      </div>

      <Field>
        <FieldLabel>Type</FieldLabel>
        <Controller
          name="field_type"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) => FIELD_TYPES.find((t) => t.value === value)?.label ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field orientation="horizontal">
        <Controller
          name="storefront_visible"
          control={form.control}
          render={({ field }) => (
            <Switch
              id="storefront_visible"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <FieldLabel htmlFor="storefront_visible">Visible on storefront</FieldLabel>
      </Field>
    </div>
  )

  const submitButton = (
    <Button type="submit" size="sm" disabled={create.isPending}>
      {create.isPending && <Loader2Icon className="size-4 animate-spin" />}
      Create definition
    </Button>
  )

  const handleSubmit = form.handleSubmit(onSubmit)

  return (
    <form
      onSubmit={(e) => {
        // The drawer is portaled out of the DOM but React bubbles synthetic
        // events through the React tree, so without this guard the outer
        // product form's onSubmit also fires. Hard-stop here.
        e.stopPropagation()
        handleSubmit(e)
      }}
      className="flex h-full flex-col"
    >
      {renderShell({ fields, submitButton })}
    </form>
  )
}
