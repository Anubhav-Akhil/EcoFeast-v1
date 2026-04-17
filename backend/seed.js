/**
 * seed.js — reads the local ecofeast.json and upserts all records into MongoDB Atlas.
 * Run once:  node backend/seed.js
 * Requires MONGODB_URI to be set (in a .env file or your shell).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { connectDb } from './db.js';
import User from './models/User.js';
import Item from './models/Item.js';
import Order from './models/Order.js';
import Task from './models/Task.js';
import Charity from './models/Charity.js';
import ContactMessage from './models/ContactMessage.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, 'data', 'ecofeast.json');

async function seed() {
  await connectDb();
  console.log('Loading ecofeast.json …');

  const raw = fs.readFileSync(dataFile, 'utf-8');
  const data = JSON.parse(raw);

  const upsert = async (Model, records, label) => {
    let count = 0;
    for (const doc of records || []) {
      if (!doc.id) continue;
      await Model.findOneAndUpdate({ id: doc.id }, doc, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });
      count++;
    }
    console.log(`  ✅ ${label}: ${count} records`);
  };

  await upsert(User, data.users, 'Users');
  await upsert(Item, data.items, 'Items');
  await upsert(Order, data.orders, 'Orders');
  await upsert(Task, data.tasks, 'Tasks');
  await upsert(Charity, data.charities, 'Charities');
  await upsert(ContactMessage, data.contactMessages, 'ContactMessages');

  console.log('\nSeed complete ✅');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
