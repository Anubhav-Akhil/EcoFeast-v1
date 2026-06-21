import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI not found in environment.");
  process.exit(1);
}

try {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");
  const res = await User.updateMany({}, { $set: { ecoPoints: 0, creditPoints: 0 } });
  console.log(`Reset points for ${res.modifiedCount} users to 0.`);
} catch (err) {
  console.error("Error resetting points:", err);
} finally {
  await mongoose.disconnect();
  process.exit(0);
}
