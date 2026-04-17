import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', ContactMessageSchema);
