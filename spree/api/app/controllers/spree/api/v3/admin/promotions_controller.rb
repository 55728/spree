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

          # Extends the base permit list with `rules` and `actions` arrays
          # so a single `POST` / `PATCH /promotions[/:id]` can ship the
          # full graph (basics + rules + actions). Each entry is a flat
          # hash whose `type` selects the STI subclass; per-subclass
          # extras come from `additional_permitted_attributes`. The
          # `Promotion#rules=`/`actions=` setters reconcile to the
          # desired set on save.
          def permitted_params
            base = params.permit(*permitted_attributes).to_h
            rules = permit_subclassed_collection(:rules, Spree.promotions.rules)
            actions = permit_subclassed_collection(:actions, Spree.promotions.actions)

            base[:rules] = rules if params.key?(:rules)
            base[:actions] = actions if params.key?(:actions)

            normalize_params(ActionController::Parameters.new(base).permit!)
          end

          private

          def promotion_includes
            [:stores, :promotion_actions, :promotion_rules]
          end

          # Permits an array of subclass payloads (`rules` / `actions`).
          # Each entry is permitted with the union of every registered
          # subclass's `additional_permitted_attributes`, plus `id`,
          # `type`, and `preferences`. Returns the array of plain
          # hashes ready to hand to `Promotion#rules=`/`actions=`.
          def permit_subclassed_collection(key, registry)
            entries = params[key]
            return [] unless entries.is_a?(Array) || entries.respond_to?(:to_a)

            extras = registry.flat_map do |klass|
              klass.respond_to?(:additional_permitted_attributes) ? klass.additional_permitted_attributes : []
            end.uniq

            Array(entries).map do |entry|
              entry = entry.respond_to?(:to_unsafe_h) ? ActionController::Parameters.new(entry.to_unsafe_h) : ActionController::Parameters.new(entry.to_h)
              entry.permit(:id, :type, { preferences: {} }, *extras).to_h
            end
          end
        end
      end
    end
  end
end
