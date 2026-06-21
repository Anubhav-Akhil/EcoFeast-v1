import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-delete expired OTPs after 15 minutes
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OTP', OTPSchema);
