import { zodResolver } from '@hookform/resolvers/zod'
import type {
  TaxCategory,
  TaxCategoryCreateParams,
  TaxCategoryUpdateParams,
} from '@spree/admin-sdk'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { adminClient } from '@/client'
import { Can } from '@/components/spree/can'
import { useConfirm } from '@/components/spree/confirm-dialog'
import { ResourceTable, resourceSearchSchema } from '@/components/spree/resource-table'
import { useRowClickBridge } from '@/components/spree/row-click-bridge'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateTaxCategory,
  useDeleteTaxCategory,
  useTaxCategory,
  useUpdateTaxCategory,
} from '@/hooks/use-tax-categories'
import { Subject } from '@/lib/permissions'
import '@/tables/tax-categories'

const taxCategoriesSearchSchema = resourceSearchSchema.extend({
  edit: z.string().optional(),
  new: z.coerce.boolean().optional(),
})

export const Route = createFileRoute('/_authenticated/$storeId/settings/tax-categories')({
  validateSearch: taxCategoriesSearchSchema,
  component: TaxCategoriesPage,
})

function TaxCategoriesPage() {
  const search = Route.useSearch() as z.infer<typeof taxCategoriesSearchSchema>
  const navigate = useNavigate()

  const editId = search.edit
  const isCreating = !!search.new

  const closeSheet = () =>
    navigate({
      search: (prev: Record<string, unknown>) => {
        const { edit: _e, new: _n, ...rest } = prev
        return rest as never
      },
    })

  const openCreate = () =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, new: true }) as never })

  const openEdit = (id: string) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, edit: id }) as never })

  useRowClickBridge('data-tax-category-id', openEdit)

  return (
    <>
      <ResourceTable<TaxCategory>
        tableKey="tax-categories"
        queryKey="tax-categories"
        queryFn={(params) => adminClient.taxCategories.list(params)}
        searchParams={search}
        actions={
          <Can I="create" a={Subject.TaxCategory}>
            <Button size="sm" className="h-[2.125rem]" onClick={openCreate}>
              <PlusIcon className="size-4" />
              Add tax category
            </Button>
          </Can>
        }
      />

      {isCreating && <CreateTaxCategorySheet open onOpenChange={(o) => !o && closeSheet()} />}
      {editId && <EditTaxCategorySheet id={editId} open onOpenChange={(o) => !o && closeSheet()} />}
    </>
  )
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  tax_code: z.string().optional(),
  description: z.string().optional(),
  is_default: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

const DEFAULT_VALUES: FormValues = { name: '', tax_code: '', description: '', is_default: false }

function valuesToParams(v: FormValues): TaxCategoryCreateParams & TaxCategoryUpdateParams {
  const blank = (s: string | undefined) => (s && s.length > 0 ? s : undefined)
  return {
    name: v.name,
    tax_code: blank(v.tax_code) ?? null,
    description: blank(v.description) ?? null,
    is_default: v.is_default,
  }
}

function CreateTaxCategorySheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const createMutation = useCreateTaxCategory()
  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: DEFAULT_VALUES,
  })

  async function onSubmit(values: FormValues) {
    await createMutation.mutateAsync(valuesToParams(values) as TaxCategoryCreateParams)
    form.reset(DEFAULT_VALUES)
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset(DEFAULT_VALUES)
        onOpenChange(next)
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add tax category</SheetTitle>
          <SheetDescription>
            Tax categories classify products for rate calculation. Setting one as the default
            demotes the previous default.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <TaxCategoryFormFields form={form} />
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating…' : 'Create tax category'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function EditTaxCategorySheet({
  id,
  open,
  onOpenChange,
}: {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: taxCategory, isLoading } = useTaxCategory(id)
  const updateMutation = useUpdateTaxCategory(id)
  const deleteMutation = useDeleteTaxCategory()
  const confirm = useConfirm()

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(formSchema) as any,
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (taxCategory) {
      form.reset({
        name: taxCategory.name,
        tax_code: taxCategory.tax_code ?? '',
        description: taxCategory.description ?? '',
        is_default: taxCategory.is_default,
      })
    }
  }, [taxCategory, form])

  async function onSubmit(values: FormValues) {
    await updateMutation.mutateAsync(valuesToParams(values))
    form.reset(values)
    onOpenChange(false)
  }

  async function onDelete() {
    const ok = await confirm({
      title: 'Delete tax category?',
      message: `${taxCategory?.name ?? 'This category'} will be removed. Products and tax rates referencing it will lose the assignment.`,
      variant: 'destructive',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    await deleteMutation.mutateAsync(id)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{taxCategory?.name ?? 'Edit tax category'}</SheetTitle>
          <SheetDescription>Update name, tax code, or default flag.</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <TaxCategoryFormFields form={form} />
            </div>
            <SheetFooter>
              <Can I="destroy" a={Subject.TaxCategory}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  disabled={form.formState.isSubmitting || deleteMutation.isPending}
                  className="mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              </Can>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={form.formState.isSubmitting || !form.formState.isDirty}
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

function TaxCategoryFormFields({
  form,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
}) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          id="name"
          autoFocus
          placeholder="e.g. Reduced rate"
          {...form.register('name')}
          aria-invalid={!!form.formState.errors.name}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </Field>

      <Field>
        <FieldLabel htmlFor="tax_code">Tax code</FieldLabel>
        <Input
          id="tax_code"
          placeholder="External tax provider code (Avalara, etc.)"
          {...form.register('tax_code')}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          rows={3}
          placeholder="Optional internal description"
          {...form.register('description')}
        />
      </Field>

      <Field>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col">
            <FieldLabel htmlFor="is_default" className="cursor-pointer">
              Default
            </FieldLabel>
            <span className="text-xs text-muted-foreground">
              Setting this demotes the previous default. Products without an explicit category fall
              back to this one.
            </span>
          </div>
          <Controller
            name="is_default"
            control={form.control}
            render={({ field }) => (
              <Switch id="is_default" checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </Field>
    </FieldGroup>
  )
}
