module Spree
  module Api
    module V3
      module Admin
        # Serializes Spree::CustomerGroup for the admin pickers
        # (e.g. promotion rule, customer-group filters). Surfaces only
        # what the admin UI needs to display + select rows.
        class CustomerGroupSerializer < V3::BaseSerializer
          typelize name: :string,
                   users_count: :number

          attributes :name, :users_count,
                     created_at: :iso8601, updated_at: :iso8601
        end
      end
    end
  end
end
