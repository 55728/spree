import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useConfirm } from '@/components/spree/confirm-dialog'
import { PromotionForm } from '@/components/spree/promotion-editors/promotion-form'
import {
  useDeletePromotion,
  usePromotion,
  usePromotionActions,
  usePromotionRules,
  useUpdatePromotion,
} from '@/hooks/use-promotions'

export const Route = createFileRoute('/_authenticated/$storeId/promotions/$promotionId')({
  component: EditPromotionPage,
})

function EditPromotionPage() {
  const { storeId, promotionId } = Route.useParams()
  const navigate = useNavigate()
  const { data: promotion } = usePromotion(promotionId)
  // Rules and actions are listed separately because the promotion serializer
  // doesn't embed them; the shared form re-hydrates once all three arrive.
  const { data: rulesData } = usePromotionRules(promotionId)
  const { data: actionsData } = usePromotionActions(promotionId)
  const updateMutation = useUpdatePromotion(promotionId)
  const deleteMutation = useDeletePromotion()
  const confirm = useConfirm()

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

  return (
    <PromotionForm
      mode="edit"
      promotion={promotion}
      initialRules={rulesData?.data}
      initialActions={actionsData?.data}
      onSubmit={async (payload) => {
        await updateMutation.mutateAsync(payload)
      }}
      onDelete={onDelete}
      deletePending={deleteMutation.isPending}
    />
  )
}
