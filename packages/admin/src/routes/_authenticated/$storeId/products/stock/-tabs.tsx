import { PageTabs } from '@/components/spree/page-tabs'

// `-tabs.tsx` is excluded from TanStack Router's file-based routing
// (the leading `-` marks it as a sibling utility file). New stock
// views (items, movements) just append entries to this list.
export function StockPageTabs({ storeId }: { storeId: string }) {
  return (
    <PageTabs
      tabs={[
        {
          key: 'stock.transfers',
          label: 'Transfers',
          to: '/$storeId/products/stock/transfers',
          params: { storeId },
          match: 'prefix',
        },
      ]}
      slotName="products.stock.tabs"
    />
  )
}
