import type { PreferenceField as PreferenceFieldDef } from '@spree/admin-sdk'
import { CurrencySelect } from '@/components/spree/currency-select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface PreferencesFormProps {
  schema: PreferenceFieldDef[]
  values: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  /** When true, replaces sensitive `password`-typed fields with a stub label. */
  redactPasswords?: boolean
  /** Optional human-readable name overrides keyed by preference key. */
  labelOverrides?: Record<string, string>
}

/**
 * Renders a generic configuration form from a `preference_schema` payload.
 * Used by the Payment Methods edit sheet and the Promotion editor's action
 * and rule cards — anywhere we let admins tune a STI subclass's settings
 * without hard-coding a per-subclass form.
 *
 * The schema itself is the source of truth; this component intentionally
 * stays "dumb" — server-side validation surfaces errors back via the
 * mutation hook's error handling. Booleans are switches, strings are
 * inputs, integers/decimals get number inputs, and unknown types fall
 * back to a plain text input.
 */
export function PreferencesForm({
  schema,
  values,
  onChange,
  redactPasswords = false,
  labelOverrides,
}: PreferencesFormProps) {
  if (!schema?.length) return null

  function setValue(key: string, value: unknown) {
    if (Object.is(values[key], value)) return
    onChange({ ...values, [key]: value })
  }

  return (
    <FieldGroup>
      {schema.map((field) => (
        <PreferenceField
          key={field.key}
          field={field}
          value={values[field.key] ?? field.default}
          label={labelOverrides?.[field.key]}
          onChange={(v) => setValue(field.key, v)}
          redactPasswords={redactPasswords}
        />
      ))}
    </FieldGroup>
  )
}

interface PreferenceFieldProps {
  field: PreferenceFieldDef
  value: unknown
  label?: string
  onChange: (value: unknown) => void
  redactPasswords?: boolean
}

export function PreferenceField({
  field,
  value,
  label,
  onChange,
  redactPasswords,
}: PreferenceFieldProps) {
  const id = `preference-${field.key}`
  const displayLabel = label ?? humanizeKey(field.key)

  // Currency-typed preferences (`currency`, `default_currency`,
  // `display_currency`, …) get the store's CurrencySelect — same
  // localized `CODE — Full Name` rendering as the rest of admin.
  if (isCurrencyKey(field.key)) {
    return (
      <Field>
        <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
        <CurrencySelect
          id={id}
          value={(value as string) || undefined}
          onChange={onChange}
        />
      </Field>
    )
  }

  switch (field.type) {
    case 'boolean':
      return (
        <Field>
          <div className="flex items-start justify-between gap-4">
            <FieldLabel htmlFor={id} className="cursor-pointer">
              {displayLabel}
            </FieldLabel>
            <Switch id={id} checked={!!value} onCheckedChange={(checked) => onChange(checked)} />
          </div>
        </Field>
      )

    case 'text':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
          <Textarea
            id={id}
            rows={4}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )

    case 'integer':
    case 'decimal':
      return (
        <Field>
          <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
          <Input
            id={id}
            type="number"
            step={field.type === 'integer' ? 1 : 'any'}
            value={value === null || value === undefined ? '' : String(value)}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') return onChange(null)
              const parsed = field.type === 'integer' ? parseInt(raw, 10) : parseFloat(raw)
              onChange(Number.isNaN(parsed) ? null : parsed)
            }}
          />
        </Field>
      )

    case 'array':
      // A generic "comma-separated list" works for the common case where
      // arrays hold IDs or short tokens. Subclasses with structured
      // arrays (option values, eligible products) ship with custom
      // editors and don't reach here.
      return (
        <Field>
          <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
          <Input
            id={id}
            value={Array.isArray(value) ? value.join(', ') : ((value as string) ?? '')}
            placeholder="comma-separated"
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
          <span className="text-xs text-muted-foreground">Separate values with commas.</span>
        </Field>
      )

    case 'password':
      if (redactPasswords) {
        return (
          <Field>
            <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              placeholder="Stored — leave blank to keep current"
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
            />
          </Field>
        )
      }
      return (
        <Field>
          <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )

    default:
      return (
        <Field>
          <FieldLabel htmlFor={id}>{displayLabel}</FieldLabel>
          <Input
            id={id}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      )
  }
}

function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isCurrencyKey(key: string): boolean {
  return key === 'currency' || key.endsWith('_currency')
}
