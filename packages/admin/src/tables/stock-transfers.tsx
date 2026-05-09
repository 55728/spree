import type { StockTransfer } from '@spree/admin-sdk'
import { ArrowLeftRightIcon } from 'lucide-react'
import { RelativeTime } from '@/components/spree/relative-time'
import { Badge } from '@/components/ui/badge'
import { defineTable } from '@/lib/table-registry'

defineTable<StockTransfer>('stock-transfers', {
  title: 'Stock Transfers',
  searchParam: 'number_cont',
  searchPlaceholder: 'Search by number or reference…',
  defaultSort: { field: 'created_at', direction: 'desc' },
  emptyIcon: <ArrowLeftRightIcon className="size-8 text-muted-foreground/50" />,
  emptyMessage: 'No stock transfers yet',
  columns: [
    {
      key: 'number',
      label: 'Number',
      sortable: true,
      filterable: true,
      default: true,
      render: (st) => (
        <button
          type="button"
          data-stock-transfer-id={st.id}
          className="font-medium tabular-nums hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {st.number}
        </button>
      ),
    },
    {
      key: 'source_destination',
      label: 'Direction',
      default: true,
      render: (st) =>
        st.source_location_id ? (
          <span className="text-sm">Transfer between locations</span>
        ) : (
          <Badge variant="outline">External receive</Badge>
        ),
    },
    {
      key: 'reference',
      label: 'Reference',
      filterable: true,
      default: true,
      render: (st) => st.reference ?? '—',
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      default: true,
      filterType: 'date',
      className: 'text-sm text-muted-foreground whitespace-nowrap',
      render: (st) => <RelativeTime iso={st.created_at} />,
    },
  ],
})
