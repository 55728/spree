import type { Promotion } from '@spree/admin-sdk'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import { adminClient } from '@/client'
import { Can } from '@/components/spree/can'
import { ResourceTable, resourceSearchSchema } from '@/components/spree/resource-table'
import { useRowClickBridge } from '@/components/spree/row-click-bridge'
import { Button } from '@/components/ui/button'
import { Subject } from '@/lib/permissions'
import '@/tables/promotions'

export const Route = createFileRoute('/_authenticated/$storeId/promotions/')({
  validateSearch: resourceSearchSchema,
  component: PromotionsPage,
})

function PromotionsPage() {
  const search = Route.useSearch()
  const navigate = useNavigate()
  const { storeId } = Route.useParams()

  function openEdit(id: string) {
    navigate({ to: '/$storeId/promotions/$promotionId', params: { storeId, promotionId: id } })
  }

  function openCreate() {
    navigate({ to: '/$storeId/promotions/new', params: { storeId } })
  }

  useRowClickBridge('data-promotion-id', openEdit)

  return (
    <ResourceTable<Promotion>
      tableKey="promotions"
      queryKey="promotions"
      queryFn={(params) => adminClient.promotions.list(params)}
      searchParams={search}
      actions={
        <Can I="create" a={Subject.Promotion}>
          <Button size="sm" className="h-[2.125rem]" onClick={openCreate}>
            <PlusIcon className="size-4" />
            New promotion
          </Button>
        </Can>
      }
    />
  )
}
