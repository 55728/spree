import type { PaymentMethod, PaymentMethodDisplayOn } from '@spree/admin-sdk'
import { CreditCardIcon } from 'lucide-react'
import { ActiveBadge } from '@/components/ui/badge'
import { defineTable } from '@/lib/table-registry'

const DISPLAY_ON_LABELS: Record<PaymentMethodDisplayOn, string> = {
  both: 'Storefront + Admin',
  front_end: 'Storefront only',
  back_end: 'Admin only',
}

defineTable<PaymentMethod>('payment-methods', {
  title: 'Payment Methods',
  searchParam: 'name_cont',
  searchPlaceholder: 'Search by name…',
  defaultSort: { field: 'position', direction: 'asc' },
  emptyIcon: <CreditCardIcon className="size-8 text-muted-foreground/50" />,
  emptyMessage: 'No payment methods configured',
  columns: [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      default: true,
      render: (pm) => (
        <button
          type="button"
          data-payment-method-id={pm.id}
          className="flex flex-col items-start text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <span className="font-medium">{pm.name}</span>
          {pm.description && (
            <span data-payment-method-id={pm.id} className="text-xs text-muted-foreground">
              {pm.description}
            </span>
          )}
        </button>
      ),
    },
    {
      key: 'type',
      label: 'Provider',
      sortable: true,
      filterable: true,
      default: true,
      // The STI subclass name is verbose ("Spree::PaymentMethod::Check"); strip
      // the namespace + class prefix so the table reads "Check" / "BogusGateway".
      render: (pm) => pm.type.replace(/^Spree::PaymentMethod::/, ''),
    },
    {
      key: 'display_on',
      label: 'Visible on',
      filterable: true,
      default: true,
      render: (pm) => DISPLAY_ON_LABELS[pm.display_on as PaymentMethodDisplayOn] ?? pm.display_on,
    },
    {
      key: 'active',
      label: 'Status',
      filterable: true,
      default: true,
      filterType: 'boolean',
      render: (pm) => (
        <ActiveBadge active={pm.active} activeLabel="Active" inactiveLabel="Disabled" />
      ),
    },
  ],
})
