import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Order from './models/Order.js';
import User from './models/User.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne({ role: 'retailer' }).lean();
  if(!user) {
    console.log('No retailer found');
    process.exit(0);
  }

  const storeId = user.id;

  console.time('Order.find-select-id');
  try {
    const orders = await Order.find({ "items.storeId": storeId }).select('_id id').limit(100).lean();
    console.log('Found', orders.length, 'orders for retailer', storeId);
  } catch(e) {
    console.error('Order find error:', e.message);
  }
  console.timeEnd('Order.find-select-id');

  process.exit(0);
}

run();
