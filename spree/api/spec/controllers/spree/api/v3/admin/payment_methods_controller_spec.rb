require 'spec_helper'

RSpec.describe Spree::Api::V3::Admin::PaymentMethodsController, type: :controller do
  render_views

  include_context 'API v3 Admin authenticated'

  let!(:payment_method) { create(:check_payment_method, stores: [store]) }

  before { request.headers.merge!(headers) }

  describe 'GET #index' do
    it 'returns store-scoped payment methods' do
      get :index, as: :json

      expect(response).to have_http_status(:ok)
      expect(json_response['data']).to be_an(Array)
      expect(json_response['data'].map { |pm| pm['id'] }).to include(payment_method.prefixed_id)
    end

    context 'when payment method belongs to a different store' do
      let!(:other_store) { create(:store) }
      let!(:other_payment_method) { create(:check_payment_method, stores: [other_store]) }

      it 'is not returned' do
        get :index, as: :json

        expect(json_response['data'].map { |pm| pm['id'] }).not_to include(other_payment_method.prefixed_id)
      end
    end
  end

  describe 'GET #show' do
    it 'returns the payment method' do
      get :show, params: { id: payment_method.prefixed_id }, as: :json

      expect(response).to have_http_status(:ok)
      expect(json_response['id']).to eq(payment_method.prefixed_id)
    end
  end

  describe 'POST #create' do
    let(:create_params) do
      {
        type: 'Spree::PaymentMethod::Check',
        name: 'Check on delivery',
        description: 'Pay by physical check',
        active: true,
        display_on: 'back_end'
      }
    end

    it 'creates a payment method of the given STI subclass' do
      expect { post :create, params: create_params, as: :json }.
        to change(Spree::PaymentMethod, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response['type']).to eq('Spree::PaymentMethod::Check')
      expect(json_response['name']).to eq('Check on delivery')

      created = Spree::PaymentMethod.find_by_prefix_id(json_response['id'])
      expect(created.stores).to include(store)
    end

    it 'rejects an unknown subclass' do
      post :create, params: create_params.merge(type: 'NotARealClass'), as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['error']['code']).to eq('unknown_payment_method_type')
    end
  end

  describe 'PATCH #update' do
    it 'updates the payment method' do
      patch :update, params: { id: payment_method.prefixed_id, name: 'Updated', active: false }, as: :json

      expect(response).to have_http_status(:ok)
      expect(payment_method.reload.name).to eq('Updated')
      expect(payment_method.reload.active).to be false
    end
  end

  describe 'DELETE #destroy' do
    it 'soft-deletes the payment method' do
      expect { delete :destroy, params: { id: payment_method.prefixed_id }, as: :json }.
        to change { Spree::PaymentMethod.where(id: payment_method.id).count }.by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end
end
