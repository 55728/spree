import type { TaxCategory } from '@spree/admin-sdk'
import { PercentIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { defineTable } from '@/lib/table-registry'

defineTable<TaxCategory>('tax-categories', {
  title: 'Tax Categories',
  searchParam: 'name_cont',
  searchPlaceholder: 'Search by name…',
  defaultSort: { field: 'name', direction: 'asc' },
  emptyIcon: <PercentIcon className="size-8 text-muted-foreground/50" />,
  emptyMessage: 'No tax categories yet',
  columns: [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      default: true,
      render: (tc) => (
        <button
          type="button"
          data-tax-category-id={tc.id}
          className="flex flex-col items-start text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <span className="font-medium">{tc.name}</span>
          {tc.description && (
            <span data-tax-category-id={tc.id} className="text-xs text-muted-foreground">
              {tc.description}
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'tax_code',
      label: 'Tax code',
      sortable: true,
      filterable: true,
      default: true,
      render: (tc) => tc.tax_code ?? '—',
    },
    {
      key: 'is_default',
      label: 'Default',
      default: true,
      render: (tc) => (tc.is_default ? <Badge variant="outline">Default</Badge> : null),
    },
  ],
})
