import dotenv from 'dotenv';
import { connectDb } from './db.js';
import Task from './models/Task.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await connectDb();
  const t = await Task.find({ orderId: 'ord_n0pnl1tymovr929x' });
  console.log(JSON.stringify(t, null, 2));
  process.exit(0);
}

run();
