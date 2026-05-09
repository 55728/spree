# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Admin Promotions API', type: :request, swagger_doc: 'api-reference/admin.yaml' do
  include_context 'API v3 Admin'

  let!(:promotion) { create(:promotion, name: 'Summer Sale', code: 'SUMMER', stores: [store]) }
  let(:Authorization) { "Bearer #{admin_jwt_token}" }

  path '/api/v3/admin/promotions' do
    get 'List promotions' do
      tags 'Promotions'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns the store\'s promotions, including manual coupon and automatic promotions.'
      admin_scope :read, :promotions

      admin_sdk_example <<~JS
        const { data: promotions } = await client.promotions.list()
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'promotions found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)['data']
          expect(data).to be_an(Array)
          expect(data.first['name']).to eq('Summer Sale')
        end
      end
    end

    post 'Create a promotion' do
      tags 'Promotions'
      produces 'application/json'
      consumes 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Creates a new promotion. `code` is required for single-code coupon promotions; pass `multi_codes: true` with `number_of_codes` to auto-generate a batch.'
      admin_scope :write, :promotions

      admin_sdk_example <<~JS
        const promotion = await client.promotions.create({
          name: 'Black Friday',
          code: 'BLACKFRIDAY',
          starts_at: '2026-11-29T00:00:00Z',
          expires_at: '2026-12-01T00:00:00Z'
        })
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          code: { type: :string, nullable: true },
          description: { type: :string, nullable: true },
          starts_at: { type: :string, format: 'date-time', nullable: true },
          expires_at: { type: :string, format: 'date-time', nullable: true },
          usage_limit: { type: :integer, nullable: true },
          match_policy: { type: :string, enum: %w[all any] },
          advertise: { type: :boolean }
        },
        required: ['name']
      }

      response '201', 'promotion created' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { name: 'Black Friday', code: 'BLACKFRIDAY' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['name']).to eq('Black Friday')
          expect(data['code']).to eq('blackfriday')
        end
      end

      response '422', 'invalid params' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { name: '' } }

        run_test!
      end
    end
  end

  path '/api/v3/admin/promotions/{id}' do
    let(:id) { promotion.prefixed_id }

    get 'Show a promotion' do
      tags 'Promotions'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      admin_scope :read, :promotions

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :id, in: :path, type: :string, required: true

      response '200', 'promotion found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['id']).to eq(promotion.prefixed_id)
        end
      end
    end

    patch 'Update a promotion' do
      tags 'Promotions'
      produces 'application/json'
      consumes 'application/json'
      security [api_key: [], bearer_auth: []]
      admin_scope :write, :promotions

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :id, in: :path, type: :string, required: true
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: { name: { type: :string }, description: { type: :string, nullable: true } }
      }

      response '200', 'promotion updated' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { description: 'Updated description' } }

        run_test! do |response|
          expect(JSON.parse(response.body)['description']).to eq('Updated description')
        end
      end
    end

    delete 'Delete a promotion' do
      tags 'Promotions'
      security [api_key: [], bearer_auth: []]
      admin_scope :write, :promotions

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :id, in: :path, type: :string, required: true

      response '204', 'promotion deleted' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test!
      end
    end
  end

  path '/api/v3/admin/promotion_actions/types' do
    get 'List available promotion action types' do
      tags 'Promotions'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns the registered Spree::PromotionAction subclasses with their preference schemas. Used by admin UIs to populate the "Add action" picker and render generic preference forms.'
      admin_scope :read, :promotions

      admin_sdk_example <<~JS
        const { data: actionTypes } = await client.promotionActions.types()
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'action types found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)['data']
          expect(data).to be_an(Array)
          expect(data).to all(include('type', 'label', 'preference_schema'))
        end
      end
    end
  end

  path '/api/v3/admin/promotion_rules/types' do
    get 'List available promotion rule types' do
      tags 'Promotions'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Returns the registered Spree::PromotionRule subclasses with their preference schemas.'
      admin_scope :read, :promotions

      admin_sdk_example <<~JS
        const { data: ruleTypes } = await client.promotionRules.types()
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'rule types found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test! do |response|
          data = JSON.parse(response.body)['data']
          expect(data).to be_an(Array)
          expect(data).to all(include('type', 'label', 'preference_schema'))
        end
      end
    end
  end
end
