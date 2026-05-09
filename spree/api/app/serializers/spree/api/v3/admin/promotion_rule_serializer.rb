# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Admin
        # Serializes Spree::PromotionRule (and its STI subclasses) for the
        # admin promotion editor. Same shape as PromotionAction so the
        # frontend renders both with the same generic component.
        class PromotionRuleSerializer < BaseSerializer
          typelize type: :string,
                   promotion_id: :string,
                   preferences: 'Record<string, unknown>',
                   preference_schema: "Array<{ key: string; type: string; default: unknown }>",
                   label: :string

          attributes :type,
                     created_at: :iso8601, updated_at: :iso8601

          attribute :promotion_id do |rule|
            rule.promotion&.prefixed_id
          end

          attribute :preferences do |rule|
            rule.preferences.to_h
          end

          attribute :preference_schema do |rule|
            rule.class.preference_schema
          end

          attribute :label do |rule|
            rule.respond_to?(:human_name) ? rule.human_name : rule.type.to_s.demodulize
          end
        end
      end
    end
  end
end
