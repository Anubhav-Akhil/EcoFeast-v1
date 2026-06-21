import mongoose from 'mongoose';

let connected = false;

export async function connectDb() {
  if (connected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');
  await mongoose.connect(uri, {
    family: 4, // Force IPv4, bypass slow DNS/connection timeouts on IPv6
    serverSelectionTimeoutMS: 5000, // Timeout server selection after 5s instead of 30s
    socketTimeoutMS: 45000, // Close inactive sockets after 45s
  });
  connected = true;
  console.log('Connected to MongoDB Atlas');
}