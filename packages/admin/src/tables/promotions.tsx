import type { Promotion } from '@spree/admin-sdk'
import { TagIcon } from 'lucide-react'
import { RelativeTime } from '@/components/spree/relative-time'
import { Badge } from '@/components/ui/badge'
import { defineTable } from '@/lib/table-registry'

defineTable<Promotion>('promotions', {
  title: 'Promotions',
  searchParam: 'name_cont',
  searchPlaceholder: 'Search by name…',
  defaultSort: { field: 'created_at', direction: 'desc' },
  emptyIcon: <TagIcon className="size-8 text-muted-foreground/50" />,
  emptyMessage: 'No promotions yet',
  columns: [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      default: true,
      render: (p) => (
        <button
          type="button"
          data-promotion-id={p.id}
          className="flex flex-col items-start text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <span className="font-medium">{p.name}</span>
          {p.description && <span className="text-xs text-muted-foreground">{p.description}</span>}
        </button>
      ),
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      filterable: true,
      default: true,
      render: (p) => {
        if (p.kind === 'automatic') return <Badge variant="outline">Automatic</Badge>
        if (p.multi_codes) return <Badge variant="outline">{p.code_prefix ?? 'multi'}…</Badge>
        return p.code ? <code className="text-xs">{p.code}</code> : '—'
      },
    },
    {
      key: 'starts_at',
      label: 'Starts',
      sortable: true,
      filterType: 'date',
      default: true,
      className: 'text-sm text-muted-foreground whitespace-nowrap',
      render: (p) => (p.starts_at ? <RelativeTime iso={p.starts_at} /> : '—'),
    },
    {
      key: 'expires_at',
      label: 'Expires',
      sortable: true,
      filterType: 'date',
      default: true,
      className: 'text-sm text-muted-foreground whitespace-nowrap',
      render: (p) => {
        if (!p.expires_at) return <span className="text-muted-foreground">No end</span>
        const expired = new Date(p.expires_at) < new Date()
        return (
          <span className={expired ? 'text-destructive' : undefined}>
            <RelativeTime iso={p.expires_at} />
          </span>
        )
      },
    },
  ],
})
