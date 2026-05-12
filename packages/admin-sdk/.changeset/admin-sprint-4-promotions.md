---
'@spree/admin-sdk': minor
---

Sprint 4: full admin promotion stack — promotions, actions, rules, and coupon codes.

- `client.promotions` is new with `list / get / create / update / delete`. Mirrors `Spree::Promotion`: `name`, `description`, `code`, `starts_at`, `expires_at`, `usage_limit`, `match_policy`, `kind` (`'coupon_code' | 'automatic'`), `multi_codes` + `number_of_codes` + `code_prefix` for batch coupon generation, `path`, `advertise`, `promotion_category_id`, and `store_ids`.

- `client.promotions.actions` (nested) handles the STI subclass pattern: `list / get / create / update / delete` on `/promotions/:id/promotion_actions`. The create body takes a `type` (the fully-qualified subclass like `'Spree::Promotion::Actions::FreeShipping'`) plus a `preferences: { ... }` hash that round-trips through the typed setters declared on the subclass.

- `client.promotions.rules` (nested) is the same shape for `Spree::PromotionRule` subclasses (Currency, Country, ItemTotal, Product, Taxon, etc.).

- `client.promotions.couponCodes` (nested) is read-only — `list / get`. Coupon codes are server-generated based on the promotion's `multi_codes` settings.

- `client.promotionActions.types()` and `client.promotionRules.types()` are top-level discovery endpoints. Each returns `{ data: ResourceTypeDefinition[] }` where each entry is `{ type, label, description, preference_schema }`. The `preference_schema` describes the configurable knobs for a given subclass — `[{ key, type, default }]` — so admin UIs can render generic configuration forms without hard-coding per-subclass field lists.

- `client.paymentMethods.create / update` now accept an optional `preferences` hash, matching the same round-trip pattern. The serializer payload also gains `preferences` (current values) and `preference_schema` (shape).

- New shared types: `PreferenceField`, `ResourceTypeDefinition`. The previously-shipped `PaymentMethodType` is now an alias of `ResourceTypeDefinition`.
