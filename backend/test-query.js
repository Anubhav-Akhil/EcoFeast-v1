import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
await mongoose.connect(uri);

const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
const Task = mongoose.model('Task', new mongoose.Schema({}, { strict: false }));

const start = Date.now();
const orders = await Order.find({ "items.storeId": "s2" }).sort({ createdAt: -1 }).limit(100).lean();
console.log("Orders found:", orders.length, "Time:", Date.now() - start, "ms");

if(orders.length > 0) {
  const orderIds = orders.map(o => o.id);
  const startTasks = Date.now();
  const tasks = await Task.find({
    $or: [
      { orderId: { $in: orderIds }, storeId: "s2" },
      { orderId: { $in: orderIds }, storeId: null, storeName: { $in: ["Crust & Crumb"] } }
    ]
  }).lean();
  console.log("Tasks found:", tasks.length, "Time:", Date.now() - startTasks, "ms");
}

process.exit(0);
