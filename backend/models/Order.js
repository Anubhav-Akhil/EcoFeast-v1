import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    itemId: { type: String, default: 'multi' },
    userId: { type: String, required: true, index: true },
    status: { type: String, default: 'pending' },
    code: { type: String, default: '' },
    deliveryOtp: { type: String, default: null },
    timestamp: { type: String, default: '' },
    lastStatus: { type: String, default: 'pending' },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

OrderSchema.index({ "items.storeId": 1 });

export default mongoose.model('Order', OrderSchema);
