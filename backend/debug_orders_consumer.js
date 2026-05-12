import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import Order from './models/Order.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, {
    socketTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
  });
  console.log('Connected to DB');

  console.time('Order.find-consumer');
  try {
    const orders = await Order.find({ userId: 'some-user-id' }).sort({ createdAt: -1 }).limit(100).lean();
    console.log('Found', orders.length, 'orders');
  } catch(e) {
    console.error('Order find error:', e.message);
  }
  console.timeEnd('Order.find-consumer');

  process.exit(0);
}

run();
