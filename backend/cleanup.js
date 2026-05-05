import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

let aiClient = null;
if (process.env.GROQ_API_KEY) {
  aiClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
} else {
  console.error("GROQ_API_KEY is not set. Cannot run AI cleanup.");
  process.exit(1);
}

// Use a flexible schema so we can access title and _id
const itemSchema = new mongoose.Schema({
  title: String,
  category: String,
  description: String,
}, { strict: false });

// Only initialize the model if it hasn't been compiled yet
const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);

async function runCleanup() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas!");

    const items = await Item.find({});
    console.log(`Found ${items.length} total items in database.`);
    console.log("Scanning for non-food mischief items...\n");
    
    let removedCount = 0;

    for (const item of items) {
      console.log(`Checking item: "${item.title}"...`);
      const prompt = `Item: "${item.title}" (${item.category}) - ${item.description}. Is this edible food/grocery? Reply ONLY with JSON {"isFood": true/false}`;
      
      try {
        const response = await aiClient.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });
        
        const output = JSON.parse(response.choices[0]?.message?.content || "{}");
        
        if (output.isFood === false) {
          console.log(`\n======================================`);
          console.log(`❌ MISCHIEF DETECTED: "${item.title}" is NOT food!`);
          console.log(`Deleting from database...`);
          console.log(`======================================\n`);
          
          await Item.findByIdAndDelete(item._id);
          removedCount++;
        } else {
          console.log(`✅ Valid food.`);
        }
      } catch (aiErr) {
        console.error(`AI checking failed for "${item.title}":`, aiErr.message);
      }
      
      // Delay of 2000ms to avoid Groq rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n🎉 Cleanup complete! Successfully removed ${removedCount} invalid items from the marketplace.`);
  } catch (error) {
    console.error("Cleanup error:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

runCleanup();
