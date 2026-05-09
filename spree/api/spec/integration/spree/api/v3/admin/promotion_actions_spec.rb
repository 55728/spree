# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'Admin Promotion Actions API', type: :request, swagger_doc: 'api-reference/admin.yaml' do
  include_context 'API v3 Admin'

  let!(:promotion) { create(:promotion, stores: [store]) }
  let(:Authorization) { "Bearer #{admin_jwt_token}" }
  let(:promotion_id) { promotion.prefixed_id }

  path '/api/v3/admin/promotions/{promotion_id}/promotion_actions' do
    parameter name: :promotion_id, in: :path, type: :string, required: true

    get 'List actions for a promotion' do
      tags 'Promotions'
      produces 'application/json'
      security [api_key: [], bearer_auth: []]
      admin_scope :read, :promotions

      admin_sdk_example <<~JS
        const { data: actions } = await client.promotions.actions.list('promo_UkLWZg9DAJ')
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true

      response '200', 'actions found' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        before do
          Spree::Promotion::Actions::FreeShipping.create!(promotion: promotion)
        end

        run_test! do |response|
          data = JSON.parse(response.body)['data']
          expect(data.size).to eq(1)
          expect(data.first['type']).to eq('Spree::Promotion::Actions::FreeShipping')
          expect(data.first).to have_key('preference_schema')
        end
      end
    end

    post 'Create an action on a promotion' do
      tags 'Promotions'
      produces 'application/json'
      consumes 'application/json'
      security [api_key: [], bearer_auth: []]
      description 'Adds a new action to a promotion. The `type` is the fully-qualified subclass; pick from `GET /promotion_actions/types`.'
      admin_scope :write, :promotions

      admin_sdk_example <<~JS
        const action = await client.promotions.actions.create('promo_UkLWZg9DAJ', {
          type: 'Spree::Promotion::Actions::FreeShipping'
        })
      JS

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true
      parameter name: :body, in: :body, schema: {
        type: :object,
        properties: {
          type: { type: :string },
          preferences: { type: :object, additionalProperties: true }
        },
        required: ['type']
      }

      response '201', 'action created' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { type: 'Spree::Promotion::Actions::FreeShipping' } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['type']).to eq('Spree::Promotion::Actions::FreeShipping')
          expect(data['promotion_id']).to eq(promotion.prefixed_id)
        end
      end

      response '422', 'unknown action type' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }
        let(:body) { { type: 'Bogus::Action' } }

        run_test! do |response|
          expect(JSON.parse(response.body)['error']['code']).to eq('unknown_promotion_action_type')
        end
      end
    end
  end

  path '/api/v3/admin/promotions/{promotion_id}/promotion_actions/{id}' do
    parameter name: :promotion_id, in: :path, type: :string, required: true
    parameter name: :id, in: :path, type: :string, required: true

    let(:action) { Spree::Promotion::Actions::FreeShipping.create!(promotion: promotion) }
    let(:id) { action.prefixed_id }

    delete 'Delete an action from a promotion' do
      tags 'Promotions'
      security [api_key: [], bearer_auth: []]
      admin_scope :write, :promotions

      parameter name: 'x-spree-api-key', in: :header, type: :string, required: true
      parameter name: :Authorization, in: :header, type: :string, required: true

      response '204', 'action deleted' do
        let(:'x-spree-api-key') { secret_api_key.plaintext_token }

        run_test!
      end
    end
  end
end
