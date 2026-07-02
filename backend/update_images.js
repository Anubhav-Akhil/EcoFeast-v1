/**
 * update_images.js — Updates images for "Tawa Roti" and "Veg Thali" items in MongoDB.
 * Run:  node backend/update_images.js
 */

import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDb } from './db.js';
import Item from './models/Item.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function main() {
  await connectDb();

  // First, let's find all items to see which ones match "tawa roti" and "veg thali"
  const allItems = await Item.find({}).select('id title image').lean();
  console.log(`\nFound ${allItems.length} total items:\n`);
  for (const item of allItems) {
    console.log(`  [${item.id}] "${item.title}" → ${item.image}`);
  }

  // Find tawa roti items (case-insensitive)
  const tawaItems = allItems.filter(i => i.title.toLowerCase().includes('tawa') && i.title.toLowerCase().includes('roti'));
  console.log(`\nTawa Roti matches: ${tawaItems.length}`);
  for (const item of tawaItems) {
    console.log(`  → ${item.id}: "${item.title}"`);
  }

  // Find veg thali items (case-insensitive)
  const thaliItems = allItems.filter(i => i.title.toLowerCase().includes('veg') && i.title.toLowerCase().includes('thali'));
  console.log(`\nVeg Thali matches: ${thaliItems.length}`);
  for (const item of thaliItems) {
    console.log(`  → ${item.id}: "${item.title}"`);
  }

  // Update tawa roti images
  if (tawaItems.length > 0) {
    const result = await Item.updateMany(
      { title: { $regex: /tawa.*roti|roti.*tawa/i } },
      { $set: { image: '/tawa-roti.png' } }
    );
    console.log(`\n✅ Updated ${result.modifiedCount} Tawa Roti item(s) with new image.`);
  } else {
    console.log('\n⚠ No Tawa Roti items found to update.');
  }

  // Update veg thali images
  if (thaliItems.length > 0) {
    const result = await Item.updateMany(
      { title: { $regex: /veg.*thali|thali.*veg/i } },
      { $set: { image: '/veg-thali.png' } }
    );
    console.log(`✅ Updated ${result.modifiedCount} Veg Thali item(s) with new image.`);
  } else {
    console.log('⚠ No Veg Thali items found to update.');
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
