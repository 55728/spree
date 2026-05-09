module Spree
  module Api
    module V3
      module Admin
        # CRUD for `Spree::PromotionAction` STI subclasses. Each action is
        # nested under a promotion; the create body picks the subclass via
        # `type` and the typed-preferences shape (`preferences: {...}`).
        class PromotionActionsController < ResourceController
          include Spree::Api::V3::Admin::SubclassedResource

          scoped_resource :promotions

          subclassed_via -> { Spree.promotions.actions },
                         unknown_type_error: 'unknown_promotion_action_type'

          def types
            authorize! :read, model_class

            render json: { data: model_class.subclasses_with_preference_schema }
          end

          protected

          def model_class
            Spree::PromotionAction
          end

          def serializer_class
            Spree.api.admin_promotion_action_serializer
          end

          def permitted_params
            params.permit(:type, preferences: {})
          end

          def set_parent
            return if action_name == 'types'

            @parent = Spree::Promotion.accessible_by(current_ability, :show)
                                      .find_by_prefix_id!(params[:promotion_id])
          end

          def parent_association
            :promotion_actions
          end

          private

          def build_subclassed_resource(klass, attrs)
            klass.new(attrs.merge(promotion: @parent))
          end
        end
      end
    end
  end
end
