import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);

const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));

const count = await Order.countDocuments();
console.log("Total orders:", count);

const sample = await Order.findOne();
console.log("Sample order:", JSON.stringify(sample, null, 2));

process.exit(0);
