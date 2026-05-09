module Spree
  module Api
    module V3
      module Admin
        # CRUD for `Spree::PromotionRule` STI subclasses. Same shape as
        # PromotionActionsController — only the registry differs
        # (`Spree.promotions.rules` instead of `Spree.promotions.actions`).
        class PromotionRulesController < ResourceController
          scoped_resource :promotions

          def create
            klass = resolve_subclass(permitted_params[:type])
            return render_unknown_type unless klass

            attrs = permitted_params.except(:type, :preferences)
            preferences = permitted_params[:preferences]

            @resource = klass.new(attrs.merge(promotion: @parent))
            apply_preferences(@resource, preferences) if preferences.present?
            authorize_resource!(@resource, :create)

            if @resource.save
              render json: serialize_resource(@resource), status: :created
            else
              render_validation_error(@resource.errors)
            end
          end

          def update
            @resource = find_resource
            authorize_resource!(@resource, :update)

            attrs = permitted_params.except(:type, :preferences)
            preferences = permitted_params[:preferences]

            @resource.assign_attributes(attrs)
            apply_preferences(@resource, preferences) if preferences.present?

            if @resource.save
              render json: serialize_resource(@resource)
            else
              render_validation_error(@resource.errors)
            end
          end

          def types
            authorize! :read, model_class

            render json: { data: model_class.subclasses_with_preference_schema }
          end

          protected

          def model_class
            Spree::PromotionRule
          end

          def serializer_class
            Spree.api.admin_promotion_rule_serializer
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
            :promotion_rules
          end

          private

          def resolve_subclass(type_name)
            return nil if type_name.blank?

            Spree.promotions.rules.find { |klass| klass.to_s == type_name }
          end

          def render_unknown_type
            render_error(
              code: 'unknown_promotion_rule_type',
              message: Spree.t(:invalid_promotion_rule_type, scope: :api,
                                                             default: 'Unknown promotion rule type'),
              status: :unprocessable_content
            )
          end

          def apply_preferences(resource, preferences)
            preferences.each do |key, value|
              next unless resource.has_preference?(key.to_sym)

              resource.set_preference(key.to_sym, value)
            end
          end
        end
      end
    end
  end
end
