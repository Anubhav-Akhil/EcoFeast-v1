import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    itemId: { type: String, default: 'multi' },
    userId: { type: String, required: true, index: true },
    status: { type: String, default: 'pending' },
    code: { type: String, default: '' },
    timestamp: { type: String, default: '' },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Order', OrderSchema);
