module Spree
  module Api
    module V3
      module Admin
        # Inventory movement between stock locations, or external →
        # location for receives. Pass `source_location_id` for transfers,
        # omit it for receives (vendor stock arriving). Each request body
        # carries a `variants` array of `{ variant_id, quantity }` pairs;
        # the model fans them out across `stock_movements` and adjusts the
        # source/destination `count_on_hand` atomically.
        class StockTransfersController < ResourceController
          scoped_resource :settings

          def create
            authorize!(:create, model_class)

            destination = find_stock_location!(params[:destination_location_id])
            return if destination.nil?

            source = nil
            if params[:source_location_id].present?
              source = find_stock_location!(params[:source_location_id])
              return if source.nil?
            end

            variants_map = build_variants_map(params[:variants])

            if variants_map.empty?
              return render_error(
                code: 'invalid_variants',
                message: Spree.t('stock_transfer.errors.must_have_variant'),
                status: :unprocessable_content
              )
            end

            @resource = Spree::StockTransfer.new(
              source_location: source,
              destination_location: destination,
              reference: params[:reference]
            )

            if @resource.transfer(source, destination, variants_map)
              render json: serialize_resource(@resource), status: :created
            else
              render_validation_error(@resource.errors)
            end
          end

          protected

          def model_class
            Spree::StockTransfer
          end

          def serializer_class
            Spree.api.admin_stock_transfer_serializer
          end

          def collection_includes
            [:source_location, :destination_location]
          end

          private

          def find_stock_location!(prefixed_id)
            location = Spree::StockLocation.find_by_prefix_id(prefixed_id)
            return location if location

            render_error(
              code: 'stock_location_not_found',
              message: Spree.t(:resource_not_found, scope: :api),
              status: :not_found
            )
            nil
          end

          # Resolves the request's `[{ variant_id, quantity }]` payload into
          # the `{ variant => quantity }` hash `StockTransfer#transfer`
          # expects. Variants the merchant doesn't have access to (or that
          # don't exist) are simply dropped — the model layer's
          # `stock_movements_not_empty` validation surfaces a 422 if the
          # final hash ends up empty.
          def build_variants_map(input)
            entries = input.respond_to?(:each) ? input.to_a : []

            entries.each_with_object({}) do |entry, acc|
              hash = entry.respond_to?(:to_unsafe_h) ? entry.to_unsafe_h : entry
              next unless hash.is_a?(Hash)

              variant = Spree::Variant.find_by_prefix_id(hash[:variant_id] || hash['variant_id'])
              quantity = (hash[:quantity] || hash['quantity']).to_i
              next if variant.nil? || quantity.zero?

              acc[variant] = quantity
            end
          end
        end
      end
    end
  end
end
