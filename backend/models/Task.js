import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, default: null },
    storeName: { type: String, default: '' },
    pickupAddress: { type: String, default: '' },
    dropAddress: { type: String, default: '' },
    charityName: { type: String, default: '' },
    weight: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    itemsSummary: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Task', TaskSchema);
