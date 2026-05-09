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

          def collection_includes
            [:stores, :promotion_actions, :promotion_rules]
          end
        end
      end
    end
  end
end
