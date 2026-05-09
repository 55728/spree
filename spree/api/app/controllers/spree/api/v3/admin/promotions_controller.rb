module Spree
  module Api
    module V3
      module Admin
        class PromotionsController < ResourceController
          scoped_resource :promotions

          protected

          def model_class
            Spree::Promotion
          end

          def serializer_class
            Spree.api.admin_promotion_serializer
          end

          # Used by index. Show/update/create paths read these too — the
          # serializer flattens stores/actions/rules into id arrays — so
          # also expose via scope_includes for find_resource.
          def collection_includes
            promotion_includes
          end

          def scope_includes
            promotion_includes
          end

          private

          def promotion_includes
            [:stores, :promotion_actions, :promotion_rules]
          end
        end
      end
    end
  end
end
