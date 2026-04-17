import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true },
    ecoPoints: { type: Number, default: 0 },
    creditPoints: { type: Number, default: 0 },
    charityPointsGained: { type: Number, default: 0 },
    organizationName: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    vehicleType: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
