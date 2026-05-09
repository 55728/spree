module Spree
  module Api
    module V3
      module Admin
        # Shared `create` / `update` flow for STI parents whose subclass is
        # picked at request time and whose configuration lives in a
        # `preferences` hash (PaymentMethod, PromotionAction, PromotionRule).
        #
        # Including controllers declare:
        #
        #   subclassed_via -> { Spree::PaymentMethod.providers },
        #                  unknown_type_error: 'unknown_payment_method_type'
        #
        # The body picks the subclass against the registry (returns 422 with
        # the configured error code on miss), strips `type`/`preferences`
        # from the permitted attrs, builds/assigns the rest, and routes
        # preference values through the typed `preferred_<name>=` setters
        # so booleans/decimals/etc. get coerced. Unknown preference keys
        # are silently dropped — the schema endpoint is the source of truth
        # for what's settable.
        module SubclassedResource
          extend ActiveSupport::Concern

          class_methods do
            def subclassed_via(registry, unknown_type_error:)
              @subclass_registry = registry
              @unknown_type_error_code = unknown_type_error
            end

            def subclass_registry
              @subclass_registry || (superclass.respond_to?(:subclass_registry) ? superclass.subclass_registry : nil)
            end

            def unknown_type_error_code
              @unknown_type_error_code ||
                (superclass.respond_to?(:unknown_type_error_code) ? superclass.unknown_type_error_code : nil)
            end
          end

          def create
            klass = resolve_subclass(permitted_params[:type])
            return render_unknown_type unless klass

            attrs = permitted_params.except(:type, :preferences)
            preferences = permitted_params[:preferences]

            @resource = build_subclassed_resource(klass, attrs)
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

          private

          # Default build: top-level resource. Nested controllers (actions,
          # rules) override to attach the parent.
          def build_subclassed_resource(klass, attrs)
            klass.new(attrs)
          end

          def resolve_subclass(type_name)
            return nil if type_name.blank?

            self.class.subclass_registry.call.find { |klass| klass.to_s == type_name }
          end

          def render_unknown_type
            render_error(
              code: self.class.unknown_type_error_code,
              message: Spree.t("api.#{self.class.unknown_type_error_code}",
                               default: 'Unknown type'),
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
