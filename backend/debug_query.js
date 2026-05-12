import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  console.log('Connecting to', process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // fail fast if network/IP issue
  });
  console.log('Connected.');

  const User = mongoose.model('User', new mongoose.Schema({})); 
  
  console.log('Running query...');
  try {
    const user = await User.findOne({}).maxTimeMS(5000).lean();
    console.log('Query success:', user ? 'User found' : 'No users');
  } catch (err) {
    console.error('Query error:', err.message);
  } 
  process.exit(0);
}
run().catch(console.error);
