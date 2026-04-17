import mongoose from 'mongoose';

const CharitySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    mission: { type: String, default: '' },
    description: { type: String, default: '' },
    contact: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Charity', CharitySchema);
