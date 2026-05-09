module Spree
  module Api
    module V3
      module Admin
        class PaymentMethodsController < ResourceController
          scoped_resource :settings

          def create
            klass = resolve_subclass(params[:type])
            return render_unknown_type if klass.nil?

            @resource = klass.new(permitted_params)
            authorize_resource!(@resource, :create)
            @resource.stores = [current_store] if @resource.stores.empty?

            if @resource.save
              render json: serialize_resource(@resource), status: :created
            else
              render_validation_error(@resource.errors)
            end
          end

          protected

          def model_class
            Spree::PaymentMethod
          end

          def serializer_class
            Spree.api.admin_payment_method_serializer
          end

          def scope
            current_store.payment_methods.accessible_by(current_ability, :show)
          end

          def permitted_params
            params.permit(:name, :description, :active, :display_on, :auto_capture, :position, metadata: {})
          end

          private

          def resolve_subclass(type_name)
            return Spree::PaymentMethod if type_name.blank?

            Spree::PaymentMethod.providers.find { |klass| klass.to_s == type_name }
          end

          def render_unknown_type
            render_error(
              code: 'unknown_payment_method_type',
              message: Spree.t(:invalid_payment_method_type, scope: :api, default: 'Unknown payment method type'),
              status: :unprocessable_content
            )
          end
        end
      end
    end
  end
end
