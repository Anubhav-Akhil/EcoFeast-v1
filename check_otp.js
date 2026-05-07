import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './backend/models/Order.js';

dotenv.config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const codes = ['0021', '0022'];
  const orders = await Order.find({ code: { $in: codes } });
  for (const o of orders) {
    console.log(`Order Code: ${o.code}, Status: ${o.status}, OTP: ${o.deliveryOtp}`);
  }
  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
