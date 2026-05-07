import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const codes = ['0021', '0022'];
  const orders = await Order.find({ code: { $in: codes } });
  if (orders.length === 0) {
    console.log('No orders found with these codes.');
  }
  for (const o of orders) {
    console.log(`Order Code: ${o.code}, Status: ${o.status}, OTP: ${o.deliveryOtp}`);
  }
  process.exit(0);
}

check().catch(err => { console.error(err); process.exit(1); });
