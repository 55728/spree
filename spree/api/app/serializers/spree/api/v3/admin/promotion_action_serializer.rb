# frozen_string_literal: true

module Spree
  module Api
    module V3
      module Admin
        # Serializes Spree::PromotionAction (and its STI subclasses) for the
        # admin promotion editor. The shape is intentionally generic so a
        # single component can render any subclass — `preferences` is the
        # current value hash, `preference_schema` describes its fields.
        class PromotionActionSerializer < BaseSerializer
          typelize type: :string,
                   promotion_id: :string,
                   preferences: 'Record<string, unknown>',
                   preference_schema: "Array<{ key: string; type: string; default: unknown }>",
                   label: [:string, nullable: true]

          attributes :type,
                     created_at: :iso8601, updated_at: :iso8601

          attribute :promotion_id do |action|
            action.promotion&.prefixed_id
          end

          attribute :preferences do |action|
            action.preferences.to_h
          end

          attribute :preference_schema do |action|
            action.class.preference_schema
          end

          attribute :label do |action|
            action.respond_to?(:human_name) ? action.human_name : action.type.to_s.demodulize
          end
        end
      end
    end
  end
end
