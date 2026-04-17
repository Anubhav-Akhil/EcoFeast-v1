import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    storeId: { type: String, required: true, index: true },
    storeName: { type: String, default: '' },
    storeCreditPoints: { type: Number, default: 0 },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    originalPrice: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    tags: { type: [String], default: [] },
    expiry: { type: String, default: '' },
    pickupStart: { type: String, default: '' },
    pickupEnd: { type: String, default: '' },
    quantity: { type: Number, default: 0 },
    status: { type: String, default: 'available' },
    forAnimalFeed: { type: Boolean, default: false },
    forCharity: { type: Boolean, default: false },
    rescuedCount: { type: Number, default: 0 },
    charityClaimCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Item', ItemSchema);
