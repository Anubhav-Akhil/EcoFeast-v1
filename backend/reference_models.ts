// REFERENCE ONLY: This would be server-side code in a real Node.js environment
/*
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['consumer', 'store', 'charity', 'volunteer', 'admin'], default: 'consumer' },
  ecoPoints: { type: Number, default: 0 },
  location: { type: { type: String, default: 'Point' }, coordinates: [Number] }
}, { timestamps: true });

const ItemSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  originalPrice: Number,
  discountPrice: Number,
  quantity: Number,
  expiry: Date,
  category: String,
  status: { type: String, enum: ['available', 'reserved', 'sold', 'donated'], default: 'available' }
}, { timestamps: true });

export const UserModel = mongoose.model('User', UserSchema);
export const ItemModel = mongoose.model('Item', ItemSchema);
*/