module Spree
  module Api
    module V3
      module Admin
        class PaymentMethodsController < ResourceController
          include Spree::Api::V3::Admin::SubclassedResource

          scoped_resource :settings

          subclassed_via -> { Spree::PaymentMethod.providers },
                         unknown_type_error: 'unknown_payment_method_type'

          # Lists available payment provider subclasses for the create form.
          # Returns: { data: [{ type, label, description, preference_schema }] }.
          # The preference_schema array describes the provider-specific
          # configuration fields, so admin UIs can render a generic
          # preferences form without hard-coding per-provider knowledge.
          def types
            authorize! :create, model_class

            render json: { data: model_class.subclasses_with_preference_schema }
          end

          protected

          def model_class
            Spree::PaymentMethod
          end

          def serializer_class
            Spree.api.admin_payment_method_serializer
          end

          private

          # New payment methods get scoped to the current store automatically.
          def build_subclassed_resource(klass, attrs)
            resource = klass.new(attrs)
            resource.stores = [current_store] if resource.stores.empty?
            resource
          end
        end
      end
    end
  end
end
