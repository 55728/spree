module Spree
  # Adds class-level helpers that surface a JSON-friendly description of
  # a `Preferable` class's `preference :name, :type, default:` declarations.
  #
  # Used by the admin API (`/payment_methods/types`, `/promotion_actions/types`,
  # `/promotion_rules/types`) so that admin UIs can render configuration forms
  # for any provider/action/rule subclass without hard-coding field lists.
  module PreferenceSchema
    extend ActiveSupport::Concern

    class_methods do
      # Returns `[{ key:, type:, default: }]` for every preference declared
      # on this class (and its ancestors). Skips deprecated preferences.
      #
      # The shape is intentionally narrow: the frontend only needs the type
      # (`string`, `text`, `integer`, `decimal`, `boolean`, `array`, etc.) and
      # the default to render a sensible field. Validation lives server-side.
      def preference_schema
        instance = new
        instance.defined_preferences.filter_map do |pref|
          next if instance.preference_deprecated(pref)

          {
            key: pref,
            type: instance.preference_type(pref),
            default: safe_preference_default(instance, pref)
          }
        end
      rescue StandardError
        []
      end

      # Returns a `[{ type:, label:, description:, preference_schema: }]`
      # array for every concrete subclass in `subclasses`. Sorted by label
      # for stable output.
      def subclasses_with_preference_schema
        registered_subclasses.map do |klass|
          {
            type: klass.to_s,
            label: klass.respond_to?(:model_name) ? klass.model_name.human : klass.to_s.demodulize,
            description: klass.respond_to?(:description) ? klass.description : nil,
            preference_schema: klass.respond_to?(:preference_schema) ? klass.preference_schema : []
          }
        end.sort_by { |entry| entry[:label] }
      end

      private

      # Each STI parent (PaymentMethod, PromotionAction, PromotionRule)
      # already exposes its registry — we just route to the right one.
      # Override in the including class to add support for custom parents.
      def registered_subclasses
        return providers if respond_to?(:providers)
        return Spree.promotions.actions if name == 'Spree::PromotionAction'
        return Spree.promotions.rules if name == 'Spree::PromotionRule'

        []
      end

      # Defaults can be Procs that hit the database (e.g. `Spree::Store.default`);
      # those aren't safe to evaluate at request time, so we stringify them.
      def safe_preference_default(instance, pref)
        instance.preference_default(pref)
      rescue StandardError
        nil
      end
    end
  end
end
