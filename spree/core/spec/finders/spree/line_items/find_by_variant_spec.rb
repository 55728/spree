# frozen_string_literal: true

require 'spec_helper'

module Spree
  describe LineItems::FindByVariant do
    subject { described_class.new }

    let(:order) { create(:order_with_line_items, line_items_count: 1) }
    let(:line_item) { order.line_items.first }
    let(:variant) { line_item.variant }

    context 'when line item exists and compare service returns true' do
      it 'returns the line item' do
        result = subject.execute(order: order, variant: variant)
        expect(result).to eq(line_item)
      end
    end

    context 'when line item exists but compare service returns false' do
      before do
        compare_service = double
        allow(compare_service).to receive(:call).and_return(double(value: false))
        allow(Spree).to receive(:cart_compare_line_items_service).and_return(compare_service)
      end

      it 'returns nil' do
        result = subject.execute(order: order, variant: variant)
        expect(result).to be_nil
      end
    end

    context 'when line item does not exist' do
      let(:other_variant) { create(:variant) }

      it 'returns nil' do
        result = subject.execute(order: order, variant: other_variant)
        expect(result).to be_nil
      end
    end

    context 'when line items are preloaded' do
      before { order.line_items.load }

      it 'returns the line item using detect' do
        result = subject.execute(order: order, variant: variant)
        expect(result).to eq(line_item)
      end
    end
  end
end
