import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, default: null, index: true },
    storeId: { type: String, default: null, index: true },
    storeName: { type: String, default: '' },
    volunteerId: { type: String, default: null, index: true },
    volunteerName: { type: String, default: null },
    volunteerPhone: { type: String, default: null },
    volunteerVehicleType: { type: String, default: null },
    pickupAddress: { type: String, default: '' },
    dropAddress: { type: String, default: '' },
    charityName: { type: String, default: '' },
    weight: { type: String, default: '' },
    status: { type: String, default: 'pending' },
    itemsSummary: { type: String, default: '' },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('Task', TaskSchema);
