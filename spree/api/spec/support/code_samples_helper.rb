# frozen_string_literal: true

module CodeSamplesHelper
  SDK_CLIENT_INIT = <<~JS.strip
    import { createClient } from '@spree/sdk'

    const client = createClient({
      baseUrl: 'https://your-store.com',
      publishableKey: '<api-key>',
    })
  JS

  ADMIN_SDK_CLIENT_INIT = <<~JS.strip
    import { createAdminClient } from '@spree/admin-sdk'

    const client = createAdminClient({
      baseUrl: 'https://your-store.com',
      secretKey: 'sk_xxx',
    })
  JS

  ADMIN_SDK_EXAMPLES_ROOT = File.expand_path('../../../../packages/admin-sdk/examples', __dir__)

  # Match `// region:example` / `// endregion:example` markers and extract
  # the body between them. The markers can have arbitrary indentation.
  ADMIN_SDK_EXAMPLE_REGION = /^[ \t]*\/\/\s*region:example\s*\n(.*?)^[ \t]*\/\/\s*endregion:example/m

  def code_samples(*samples)
    metadata[:operation][:'x-codeSamples'] = samples.map do |sample|
      { lang: sample[:lang], label: sample[:label], source: sample[:source].strip }
    end
  end

  def sdk_example(source)
    code_samples(
      {
        lang: 'javascript',
        label: 'Spree SDK',
        source: "#{SDK_CLIENT_INIT}\n\n#{source.strip}\n"
      }
    )
  end

  ADMIN_SDK_EXAMPLE_CACHE = {}

  # Renders an admin SDK code sample from a typechecked example file under
  # `packages/admin-sdk/examples/`. The file must be a complete `.ts`
  # module (imports + `createAdminClient` initializer) so `tsc` can verify
  # it against the live SDK types; the helper extracts only the body
  # between `// region:example` / `// endregion:example` markers and
  # re-prepends the canonical client init block so rendered docs stay
  # consistent across endpoints.
  #
  #   admin_sdk_example 'promotions/create'
  #     → packages/admin-sdk/examples/promotions/create.ts
  def admin_sdk_example(name)
    source = ADMIN_SDK_EXAMPLE_CACHE[name] ||= load_admin_sdk_example(name)
    code_samples(
      {
        lang: 'javascript',
        label: 'Spree Admin SDK',
        source: "#{ADMIN_SDK_CLIENT_INIT}\n\n#{source}\n"
      }
    )
  end

  def load_admin_sdk_example(name)
    path = File.join(ADMIN_SDK_EXAMPLES_ROOT, "#{name}.ts")
    raise "Admin SDK example not found: #{path}" unless File.exist?(path)

    body = File.read(path).match(ADMIN_SDK_EXAMPLE_REGION)&.captures&.first
    raise "Admin SDK example #{name.inspect} has no `// region:example` marker" if body.nil?

    body.rstrip.strip_heredoc.strip
  end

  # Appends a `**Required scope:**` line to the operation description.
  # Use in admin integration specs to surface scope requirements in the
  # rendered Mintlify docs without inventing a custom OpenAPI extension.
  #
  #   admin_scope :read, :orders
  #   admin_scope :write, :customers
  def admin_scope(action, resource)
    line = "**Required scope:** `#{action}_#{resource}` (for API-key authentication)."
    existing = metadata[:operation][:description].to_s
    metadata[:operation][:description] = existing.empty? ? line : "#{existing}\n\n#{line}"
  end
end

RSpec.configure do |config|
  config.extend CodeSamplesHelper, type: :request
end
