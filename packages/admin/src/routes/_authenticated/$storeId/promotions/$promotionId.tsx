import type { ResourceTypeDefinition } from '@spree/admin-sdk'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DownloadIcon, PlusIcon, TrashIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { formatCalculatorSummary } from '@/components/spree/calculator-summary'
import { Can } from '@/components/spree/can'
import { useConfirm } from '@/components/spree/confirm-dialog'
import { PageHeader } from '@/components/spree/page-header'
import { PreferencesForm } from '@/components/spree/preferences-form'
import { EditorShell } from '@/components/spree/promotion-editors/editor-shell'
import '@/components/spree/promotion-editors/register'
import {
  actionDraftFromAction,
  actionDraftFromType,
  actionDraftToPayload,
  actionFormSlot,
  type PromotionActionEditorContext,
  type PromotionActionFormDraft,
  type PromotionRuleEditorContext,
  type PromotionRuleFormDraft,
  ruleDraftFromRule,
  ruleDraftFromType,
  ruleDraftToPayload,
  ruleFormSlot,
} from '@/components/spree/promotion-editors/types'
import { ResourceLayout } from '@/components/spree/resource-layout'
import { Slot } from '@/components/spree/slot'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useExport } from '@/hooks/use-export'
import {
  useDeletePromotion,
  usePromotion,
  usePromotionActions,
  usePromotionActionTypes,
  usePromotionCouponCodes,
  usePromotionRules,
  usePromotionRuleTypes,
  useUpdatePromotion,
} from '@/hooks/use-promotions'
import { Subject } from '@/lib/permissions'

export const Route = createFileRoute('/_authenticated/$storeId/promotions/$promotionId')({
  component: EditPromotionPage,
})

interface PromotionFormValues {
  name: string
  description: string
  starts_at: string
  expires_at: string
  usage_limit: number | undefined
  match_policy: 'all' | 'any'
  rules: PromotionRuleFormDraft[]
  actions: PromotionActionFormDraft[]
}

const MATCH_POLICY_OPTIONS = [
  { value: 'all', label: 'All rules must match' },
  { value: 'any', label: 'Any rule may match' },
] as const

const DEFAULT_VALUES: PromotionFormValues = {
  name: '',
  description: '',
  starts_at: '',
  expires_at: '',
  usage_limit: undefined,
  match_policy: 'all',
  rules: [],
  actions: [],
}

function EditPromotionPage() {
  const { storeId, promotionId } = Route.useParams()
  const navigate = useNavigate()
  const { data: promotion, isLoading } = usePromotion(promotionId)
  // Rules and actions are listed separately because the promotion serializer
  // doesn't embed them; we re-hydrate the form once both lists arrive.
  const { data: rulesData } = usePromotionRules(promotionId)
  const { data: actionsData } = usePromotionActions(promotionId)
  const updateMutation = useUpdatePromotion(promotionId)
  const deleteMutation = useDeletePromotion()
  const confirm = useConfirm()

  const form = useForm<PromotionFormValues>({ defaultValues: DEFAULT_VALUES })

  const rulesArray = useFieldArray({ control: form.control, name: 'rules', keyName: '_key' })
  const actionsArray = useFieldArray({ control: form.control, name: 'actions', keyName: '_key' })

  // Seed the form once the promotion + its child collections all arrive.
  // Re-runs after a successful submit because the queries are invalidated.
  // biome-ignore lint/correctness/useExhaustiveDependencies: form is stable
  useEffect(() => {
    if (!promotion || !rulesData || !actionsData) return
    form.reset({
      name: promotion.name,
      description: promotion.description ?? '',
      starts_at: promotion.starts_at ?? '',
      expires_at: promotion.expires_at ?? '',
      usage_limit: promotion.usage_limit ?? undefined,
      match_policy: promotion.match_policy,
      rules: rulesData.data.map(ruleDraftFromRule),
      actions: actionsData.data.map(actionDraftFromAction),
    })
  }, [promotion, rulesData, actionsData])

  async function onSubmit(values: PromotionFormValues) {
    await updateMutation.mutateAsync({
      name: values.name,
      description: values.description?.length ? values.description : null,
      starts_at: values.starts_at || null,
      expires_at: values.expires_at || null,
      usage_limit: values.usage_limit ?? null,
      match_policy: values.match_policy,
      rules: values.rules.map(ruleDraftToPayload),
      actions: values.actions.map(actionDraftToPayload),
    })
  }

  async function onDelete() {
    const ok = await confirm({
      title: 'Delete promotion?',
      message: `${promotion?.name ?? 'This promotion'} will be removed permanently. Promotions referenced by completed orders cannot be deleted.`,
      variant: 'destructive',
      confirmLabel: 'Delete',
    })
    if (!ok) return
    await deleteMutation.mutateAsync(promotionId)
    navigate({ to: '/$storeId/promotions', params: { storeId } })
  }

  if (isLoading || !promotion) {
    return (
      <ResourceLayout
        header={<PageHeader title="Loading…" backTo="promotions" />}
        main={<div className="text-sm text-muted-foreground">Loading promotion…</div>}
      />
    )
  }

  return (
    <ResourceLayout
      header={
        <PageHeader
          title={promotion.name}
          backTo="promotions"
          actions={
            <div className="flex gap-2">
              <Can I="destroy" a={Subject.Promotion}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  disabled={deleteMutation.isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              </Can>
              <Button
                type="button"
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
                disabled={!form.formState.isDirty || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          }
        />
      }
      main={
        <>
          <PromotionBasicsCard form={form} promotion={promotion} />
          <PromotionRulesCard rulesArray={rulesArray} matchPolicy={form.watch('match_policy')} />
          <PromotionActionsCard actionsArray={actionsArray} />
          {promotion.multi_codes && <PromotionCouponCodesCard promotionId={promotionId} />}
        </>
      }
    />
  )
}

// ============================================================================
// Basics
// ============================================================================

interface PromotionBasicsCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  promotion: any
}

function PromotionBasicsCard({ form, promotion }: PromotionBasicsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basics</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" {...form.register('name')} />
          </Field>
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea id="description" rows={2} {...form.register('description')} />
          </Field>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="font-medium">Trigger: </span>
            {promotion.kind === 'automatic' ? (
              <Badge variant="outline">Automatic</Badge>
            ) : promotion.multi_codes ? (
              <span>
                Multi-code coupon ({promotion.number_of_codes ?? 0} codes
                {promotion.code_prefix ? ` with prefix "${promotion.code_prefix}"` : ''})
              </span>
            ) : (
              <span>
                Single coupon code:{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {promotion.code ?? '—'}
                </code>
              </span>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Trigger settings can't be changed after creation. Make a new promotion to change them.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Starts</FieldLabel>
              <Controller
                name="starts_at"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? '')}
                    placeholder="No start date"
                    includeTime
                  />
                )}
              />
            </Field>
            <Field>
              <FieldLabel>Expires</FieldLabel>
              <Controller
                name="expires_at"
                control={form.control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? '')}
                    placeholder="No expiry"
                    includeTime
                  />
                )}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="usage_limit">Usage limit</FieldLabel>
            <Input
              id="usage_limit"
              type="number"
              min={1}
              placeholder="Unlimited"
              {...form.register('usage_limit')}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="match_policy">When promotion has multiple rules</FieldLabel>
            <Controller
              name="match_policy"
              control={form.control}
              render={({ field }) => (
                <Select
                  items={MATCH_POLICY_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="match_policy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATCH_POLICY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Rules
// ============================================================================

type RulesArray = ReturnType<typeof useFieldArray<PromotionFormValues, 'rules', '_key'>>
type ActionsArray = ReturnType<typeof useFieldArray<PromotionFormValues, 'actions', '_key'>>

function PromotionRulesCard({
  rulesArray,
  matchPolicy,
}: {
  rulesArray: RulesArray
  matchPolicy: 'all' | 'any'
}) {
  const { data: typesData } = usePromotionRuleTypes()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const types = typesData?.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rules</CardTitle>
        <p className="text-sm text-muted-foreground">
          Conditions that decide whether the promotion applies.{' '}
          {matchPolicy === 'all' ? 'All rules must match.' : 'Any rule may match.'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rulesArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rules. Without rules, the promotion always qualifies (subject to schedule and usage
              limit).
            </p>
          ) : (
            rulesArray.fields.map((field, index) => (
              <RuleRow
                key={field._key}
                draft={field as unknown as PromotionRuleFormDraft}
                onEdit={() => setEditingIndex(index)}
                onRemove={() => rulesArray.remove(index)}
              />
            ))
          )}
          <Can I="create" a={Subject.PromotionRule}>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <PlusIcon className="size-4" />
              Add rule
            </Button>
          </Can>
        </div>

        {pickerOpen && (
          <RulePickerSheet
            types={types}
            open
            onOpenChange={(o) => !o && setPickerOpen(false)}
            onPicked={(type) => {
              const draft = ruleDraftFromType(type)
              rulesArray.append(draft)
              setPickerOpen(false)
              setEditingIndex(rulesArray.fields.length) // newly-appended row index
            }}
          />
        )}

        {editingIndex !== null && rulesArray.fields[editingIndex] && (
          <RuleEditSheet
            draft={rulesArray.fields[editingIndex] as unknown as PromotionRuleFormDraft}
            open
            onOpenChange={(o) => !o && setEditingIndex(null)}
            onSave={(next) => rulesArray.update(editingIndex, next)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function RuleRow({
  draft,
  onEdit,
  onRemove,
}: {
  draft: PromotionRuleFormDraft
  onEdit: () => void
  onRemove: () => void
}) {
  const confirm = useConfirm()

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await confirm({
      title: 'Remove rule?',
      message: 'Removed when you save the promotion.',
      variant: 'destructive',
      confirmLabel: 'Remove',
    })
    if (!ok) return
    onRemove()
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{draft.label}</div>
        <RuleSummary draft={draft} />
      </div>
      <Can I="destroy" a={Subject.PromotionRule}>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={handleRemove}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon className="size-4" />
        </Button>
      </Can>
    </button>
  )
}

function RuleSummary({ draft }: { draft: PromotionRuleFormDraft }) {
  const parts: string[] = []
  const products = nameList(draft.products)
  const categories = nameList(draft.categories)
  const customers = nameList(draft.customers, customerLabel)
  const groups = nameList(draft.customer_groups)
  const countries = nameList(draft.countries)

  if (products) parts.push(products)
  else if (draft.product_ids?.length) parts.push(`${draft.product_ids.length} products`)

  if (categories) parts.push(categories)
  else if (draft.category_ids?.length) parts.push(`${draft.category_ids.length} categories`)

  if (customers) parts.push(customers)
  else if (draft.user_ids?.length) parts.push(`${draft.user_ids.length} customers`)

  if (groups) parts.push(groups)
  if (countries) parts.push(countries)

  const policy = draft.preferences?.match_policy
  if (policy) parts.push(String(policy))

  if (parts.length === 0) return null
  return <div className="truncate text-xs text-muted-foreground">{parts.join(' · ')}</div>
}

/**
 * Joins up to 3 names; collapses the tail into "+N more". Returns null
 * when the list is missing or empty so the caller can fall back to a
 * count-based summary built from `*_ids`.
 */
function nameList<T>(
  items: T[] | undefined,
  getLabel: (item: T) => string = defaultLabel,
): string | null {
  if (!items?.length) return null
  const labels = items.map(getLabel).filter(Boolean)
  if (labels.length === 0) return null
  if (labels.length <= 3) return labels.join(', ')
  return `${labels.slice(0, 3).join(', ')} +${labels.length - 3} more`
}

function defaultLabel(o: unknown): string {
  if (
    o &&
    typeof o === 'object' &&
    'name' in o &&
    typeof (o as { name: unknown }).name === 'string'
  ) {
    return (o as { name: string }).name
  }
  return ''
}

function customerLabel(c: unknown): string {
  if (!c || typeof c !== 'object') return ''
  const o = c as { first_name?: string; last_name?: string; email?: string }
  const full = [o.first_name, o.last_name].filter(Boolean).join(' ').trim()
  return full || o.email || ''
}

function RulePickerSheet({
  types,
  open,
  onOpenChange,
  onPicked,
}: {
  types: ResourceTypeDefinition[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onPicked: (type: ResourceTypeDefinition) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add rule</SheetTitle>
          <SheetDescription>Pick a rule type to configure.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
          {types.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => onPicked(t)}
              className="flex flex-col items-start rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <span className="text-sm font-medium">{t.label}</span>
              {t.description && (
                <span className="text-xs text-muted-foreground">{t.description}</span>
              )}
            </button>
          ))}
        </div>
        <SheetFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function RuleEditSheet({
  draft,
  open,
  onOpenChange,
  onSave,
}: {
  draft: PromotionRuleFormDraft
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (next: PromotionRuleFormDraft) => void
}) {
  const onClose = () => onOpenChange(false)
  const ctx: PromotionRuleEditorContext = { draft, onSave, onClose }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{draft.label}</SheetTitle>
          <SheetDescription>Tune the rule's parameters.</SheetDescription>
        </SheetHeader>
        <Slot
          name={ruleFormSlot(draft.key)}
          context={ctx}
          fallback={<DefaultRuleEditor {...ctx} />}
        />
      </SheetContent>
    </Sheet>
  )
}

/**
 * Default rule editor — renders a generic PreferencesForm for rules
 * whose configuration is exhausted by their preference schema
 * (Currency, FirstOrder, ItemTotal, etc.).
 */
function DefaultRuleEditor({ draft, onSave, onClose }: PromotionRuleEditorContext) {
  const [values, setValues] = useState<Record<string, unknown>>(draft.preferences ?? {})

  const hasPreferences = !!draft.preference_schema?.length

  function handleSave() {
    onSave({ ...draft, preferences: values })
    onClose()
  }

  return (
    <EditorShell
      onSave={handleSave}
      onCancel={onClose}
      pending={false}
      saveDisabled={!hasPreferences}
    >
      {hasPreferences ? (
        <PreferencesForm schema={draft.preference_schema} values={values} onChange={setValues} />
      ) : (
        <p className="text-sm text-muted-foreground">
          This rule has no configurable options — its presence alone applies the constraint.
        </p>
      )}
    </EditorShell>
  )
}

// ============================================================================
// Actions
// ============================================================================

function PromotionActionsCard({ actionsArray }: { actionsArray: ActionsArray }) {
  const { data: typesData } = usePromotionActionTypes()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const types = typesData?.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <p className="text-sm text-muted-foreground">What happens when the promotion qualifies.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actionsArray.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No actions yet. A promotion without actions doesn't do anything when applied.
            </p>
          ) : (
            actionsArray.fields.map((field, index) => (
              <ActionRow
                key={field._key}
                draft={field as unknown as PromotionActionFormDraft}
                onEdit={() => setEditingIndex(index)}
                onRemove={() => actionsArray.remove(index)}
              />
            ))
          )}
          <Can I="create" a={Subject.PromotionAction}>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              <PlusIcon className="size-4" />
              Add action
            </Button>
          </Can>
        </div>

        {pickerOpen && (
          <ActionPickerSheet
            types={types}
            open
            onOpenChange={(o) => !o && setPickerOpen(false)}
            onPicked={(type) => {
              const draft = actionDraftFromType(type)
              actionsArray.append(draft)
              setPickerOpen(false)
              setEditingIndex(actionsArray.fields.length)
            }}
          />
        )}

        {editingIndex !== null && actionsArray.fields[editingIndex] && (
          <ActionEditSheet
            draft={actionsArray.fields[editingIndex] as unknown as PromotionActionFormDraft}
            open
            onOpenChange={(o) => !o && setEditingIndex(null)}
            onSave={(next) => actionsArray.update(editingIndex, next)}
          />
        )}
      </CardContent>
    </Card>
  )
}

function ActionRow({
  draft,
  onEdit,
  onRemove,
}: {
  draft: PromotionActionFormDraft
  onEdit: () => void
  onRemove: () => void
}) {
  const confirm = useConfirm()

  async function handleRemove(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await confirm({
      title: 'Remove action?',
      message: 'Removed when you save the promotion.',
      variant: 'destructive',
      confirmLabel: 'Remove',
    })
    if (!ok) return
    onRemove()
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center justify-between rounded-md border bg-card px-3 py-2 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium">{draft.label}</div>
        <ActionSummary draft={draft} />
      </div>
      <Can I="destroy" a={Subject.PromotionAction}>
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          onClick={handleRemove}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <TrashIcon className="size-4" />
        </Button>
      </Can>
    </button>
  )
}

function ActionSummary({ draft }: { draft: PromotionActionFormDraft }) {
  const parts: string[] = []
  const calc = formatCalculatorSummary(draft.calculator)
  if (calc) parts.push(calc)
  if (draft.line_items?.length) parts.push(`${draft.line_items.length} variants`)
  if (parts.length === 0) return null
  return <div className="truncate text-xs text-muted-foreground">{parts.join(' · ')}</div>
}

function ActionPickerSheet({
  types,
  open,
  onOpenChange,
  onPicked,
}: {
  types: ResourceTypeDefinition[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onPicked: (type: ResourceTypeDefinition) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add action</SheetTitle>
          <SheetDescription>Pick what should happen when the promotion qualifies.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
          {types.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => onPicked(t)}
              className="flex flex-col items-start rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
            >
              <span className="text-sm font-medium">{t.label}</span>
              {t.description && (
                <span className="text-xs text-muted-foreground">{t.description}</span>
              )}
            </button>
          ))}
        </div>
        <SheetFooter>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function ActionEditSheet({
  draft,
  open,
  onOpenChange,
  onSave,
}: {
  draft: PromotionActionFormDraft
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (next: PromotionActionFormDraft) => void
}) {
  const onClose = () => onOpenChange(false)
  const ctx: PromotionActionEditorContext = { draft, onSave, onClose }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{draft.label}</SheetTitle>
          <SheetDescription>Configure the action's parameters.</SheetDescription>
        </SheetHeader>
        <Slot
          name={actionFormSlot(draft.key)}
          context={ctx}
          fallback={<DefaultActionEditor {...ctx} />}
        />
      </SheetContent>
    </Sheet>
  )
}

function DefaultActionEditor({ draft, onSave, onClose }: PromotionActionEditorContext) {
  const [values, setValues] = useState<Record<string, unknown>>(draft.preferences ?? {})

  const hasPreferences = !!draft.preference_schema?.length

  function handleSave() {
    onSave({ ...draft, preferences: values })
    onClose()
  }

  return (
    <EditorShell
      onSave={handleSave}
      onCancel={onClose}
      pending={false}
      saveDisabled={!hasPreferences}
    >
      {hasPreferences ? (
        <PreferencesForm schema={draft.preference_schema} values={values} onChange={setValues} />
      ) : (
        <p className="text-sm text-muted-foreground">This action has no configurable options.</p>
      )}
    </EditorShell>
  )
}

// ============================================================================
// Coupon codes (multi-codes only)
// ============================================================================

function PromotionCouponCodesCard({ promotionId }: { promotionId: string }) {
  const [page, setPage] = useState(1)
  const { data: codesData, isFetching } = usePromotionCouponCodes(promotionId, {
    limit: 50,
    page,
  })
  const codes = codesData?.data ?? []
  const totalCount = codesData?.meta?.count ?? codes.length
  const totalPages = codesData?.meta?.pages ?? 1

  const exportMutation = useExport()
  function handleExport() {
    exportMutation.mutate({
      type: 'Spree::Exports::CouponCodes',
      record_selection: 'filtered',
      search_params: { promotion_id_eq: promotionId },
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Coupon codes</CardTitle>
            <p className="text-sm text-muted-foreground">
              {totalCount > 0
                ? `${totalCount} auto-generated codes. Read-only; regenerate by changing the promotion's number-of-codes setting.`
                : "Auto-generated codes for this promotion. Codes are read-only; regenerate by changing the promotion's number-of-codes setting."}
            </p>
          </div>
          {totalCount > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exportMutation.isPending}
            >
              <DownloadIcon className="size-4" />
              {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {codes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No codes generated yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {codes.map((c) => (
                <code
                  key={c.id}
                  className={`rounded border px-2 py-1 font-mono text-xs ${
                    c.state && c.state !== 'unused' ? 'text-muted-foreground line-through' : ''
                  }`}
                  title={c.state ?? undefined}
                >
                  {c.code}
                </code>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isFetching}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
