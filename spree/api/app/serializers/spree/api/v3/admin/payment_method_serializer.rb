module Spree
  module Api
    module V3
      module Admin
        class PaymentMethodSerializer < V3::PaymentMethodSerializer
          typelize active: :boolean, auto_capture: [:boolean, nullable: true],
                   metadata: 'Record<string, unknown>'

          attributes :metadata, :active, :auto_capture,
                     created_at: :iso8601, updated_at: :iso8601
        end
      end
    end
  end
end
