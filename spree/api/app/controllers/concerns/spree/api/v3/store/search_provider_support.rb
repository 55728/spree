module Spree
  module Api
    module V3
      module Store
        module SearchProviderSupport
          extend ActiveSupport::Concern

          private

          def search_query
            params.dig(:q, :search)
          end

          def search_filters
            q = params[:q]&.to_unsafe_h || params[:q] || {}
            q = q.to_h if q.respond_to?(:to_h) && !q.is_a?(Hash)
            # Decode Stripe-style prefixed IDs in `*_id_in`/`id_eq`/etc. so
            # SPA + storefront filters can pass `prod_…` keys; the search
            # provider hands the filter hash straight to Ransack on the
            # underlying scope, which expects raw integer IDs.
            decode_prefixed_id_predicates(q.except('search')).presence
          end

          def search_provider
            @search_provider ||= Spree.search_provider.constantize.new(current_store)
          end
        end
      end
    end
  end
end
