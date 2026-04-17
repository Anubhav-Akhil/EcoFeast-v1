import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { connectDb } from "./db.js";
import User from "./models/User.js";
import Item from "./models/Item.js";
import Order from "./models/Order.js";
import Task from "./models/Task.js";
import Charity from "./models/Charity.js";
import ContactMessage from "./models/ContactMessage.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked for this origin"));
    },
    credentials: true,
  })
);

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const CHARITY_CREDIT_PER_ITEM = Number(process.env.CHARITY_CREDIT_PER_ITEM || 5);
const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const nowIso = () => new Date().toISOString();
const createId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    req.auth = jwt.verify(authHeader.slice("Bearer ".length), JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

function assertRequired(value, message) {
  if (!value || (typeof value === "string" && !value.trim())) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

function toPublicUser(user) {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    ecoPoints: u.ecoPoints || 0,
    creditPoints: u.creditPoints || 0,
    organizationName: u.organizationName || undefined,
    phone: u.phone || undefined,
    address: u.address || undefined,
    vehicleType: u.vehicleType || undefined,
    charityPointsGained: u.charityPointsGained || 0,
  };
}

// ── Health ──────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: nowIso() });
});

// ── Auth ────────────────────────────────────────────────────────────────────
app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const { email, password, role, name, orgName, phone, address, vehicleType } =
      req.body || {};
    assertRequired(email, "Email is required");
    assertRequired(password, "Password is required");
    assertRequired(role, "Role is required");

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already registered" });

    const resolvedName =
      role === "retailer" || role === "charity"
        ? orgName
        : name || normalizedEmail.split("@")[0];
    assertRequired(resolvedName, "Name is required");

    const user = await User.create({
      id: role === "retailer" ? createId("s") : createId("u"),
      name: String(resolvedName).trim(),
      email: normalizedEmail,
      passwordHash: bcrypt.hashSync(String(password), 10),
      role: String(role),
      ecoPoints: role === "consumer" ? 120 : 0,
      creditPoints: role === "retailer" ? 50 : 0,
      organizationName: orgName || null,
      phone: phone || null,
      address: address || null,
      vehicleType: vehicleType || null,
    });

    const token = signToken(user);
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    assertRequired(email, "Email is required");
    assertRequired(password, "Password is required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({ user: toPublicUser(user), token });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const user = await User.findOne({ id: req.auth.sub });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user: toPublicUser(user) });
});

// ── Items ───────────────────────────────────────────────────────────────────
app.get("/api/items", async (_req, res, next) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.post(
  "/api/items",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const user = await User.findOne({ id: req.auth.sub });
      if (!user) return res.status(404).json({ message: "User not found" });

      const {
        title, description, originalPrice, discountPrice, image,
        category, tags, expiry, pickupStart, pickupEnd,
        quantity, forAnimalFeed, forCharity,
      } = req.body || {};

      assertRequired(title, "Title is required");
      assertRequired(description, "Description is required");
      assertRequired(category, "Category is required");
      assertRequired(pickupStart, "Pickup start is required");
      assertRequired(pickupEnd, "Pickup end is required");

      const item = await Item.create({
        id: createId("item"),
        storeId: user.id,
        storeName: user.organizationName || user.name,
        storeCreditPoints: Number(user.creditPoints || 0),
        title: String(title).trim(),
        description: String(description).trim(),
        originalPrice: Number(originalPrice || 0),
        discountPrice: Number(discountPrice || 0),
        image: image
          ? String(image)
          : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
        category: String(category),
        tags: Array.isArray(tags) ? tags : [],
        expiry: String(expiry || new Date(Date.now() + 24 * 3600000).toISOString()),
        pickupStart: String(pickupStart),
        pickupEnd: String(pickupEnd),
        quantity: Number(quantity || 0),
        status: "available",
        forAnimalFeed: !!forAnimalFeed,
        forCharity: !!forCharity,
        rescuedCount: 0,
        charityClaimCount: 0,
      });

      return res.status(201).json(item.toObject());
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/items/:id",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ id: req.params.id });
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (req.auth.role !== "admin" && item.storeId !== req.auth.sub) {
        return res.status(403).json({ message: "You can only delete your own items" });
      }
      await Item.deleteOne({ id: req.params.id });
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/items/:id",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const item = await Item.findOne({ id: req.params.id });
      if (!item) return res.status(404).json({ message: "Item not found" });
      if (req.auth.role !== "admin" && item.storeId !== req.auth.sub) {
        return res.status(403).json({ message: "You can only update your own items" });
      }

      const {
        title, description, originalPrice, discountPrice, image,
        category, tags, expiry, pickupStart, pickupEnd,
        quantity, quantityDelta, forAnimalFeed, forCharity,
      } = req.body || {};

      if (title !== undefined) item.title = String(title).trim();
      if (description !== undefined) item.description = String(description).trim();
      if (originalPrice !== undefined) item.originalPrice = Number(originalPrice);
      if (discountPrice !== undefined) item.discountPrice = Number(discountPrice);
      if (image !== undefined) item.image = String(image || item.image);
      if (category !== undefined) item.category = String(category);
      if (Array.isArray(tags)) item.tags = tags;
      if (expiry !== undefined) item.expiry = String(expiry);
      if (pickupStart !== undefined) item.pickupStart = String(pickupStart);
      if (pickupEnd !== undefined) item.pickupEnd = String(pickupEnd);
      if (forAnimalFeed !== undefined) item.forAnimalFeed = !!forAnimalFeed;
      if (forCharity !== undefined) item.forCharity = !!forCharity;
      if (item.forCharity) item.discountPrice = 0;
      if (quantity !== undefined) item.quantity = Math.max(0, Number(quantity));
      if (quantityDelta !== undefined)
        item.quantity = Math.max(0, Number(item.quantity || 0) + Number(quantityDelta));

      item.status = item.quantity <= 0 ? "sold" : "available";
      await item.save();
      return res.json(item.toObject());
    } catch (error) {
      next(error);
    }
  }
);

// ── Orders ──────────────────────────────────────────────────────────────────
app.post(
  "/api/orders",
  requireAuth,
  requireRole("consumer", "charity", "admin"),
  async (req, res, next) => {
    try {
      const inputItems = Array.isArray(req.body?.items) ? req.body.items : [];
      if (inputItems.length === 0) {
        return res.status(400).json({ message: "At least one item is required" });
      }

      // Build quantity map
      const quantityByItemId = new Map();
      for (const payloadItem of inputItems) {
        const itemId = payloadItem?.id;
        if (!itemId) continue;
        quantityByItemId.set(itemId, (quantityByItemId.get(itemId) || 0) + 1);
      }

      // Validate stock
      const selectedItems = [];
      for (const [itemId, requestedQty] of quantityByItemId.entries()) {
        const item = await Item.findOne({ id: itemId });
        if (!item) return res.status(404).json({ message: "One or more items were not found" });
        if (item.quantity <= 0 || item.quantity < requestedQty) {
          return res.status(409).json({ message: `${item.title} is sold out` });
        }
        for (let i = 0; i < requestedQty; i++) selectedItems.push(item);
      }

      // Deduct stock and collect charity credits
      const charityCreditsByStore = new Map();
      for (const [itemId, requestedQty] of quantityByItemId.entries()) {
        const item = await Item.findOne({ id: itemId });
        if (!item) continue;
        item.quantity -= requestedQty;
        item.rescuedCount = Number(item.rescuedCount || 0) + requestedQty;
        if (item.quantity <= 0) {
          item.quantity = 0;
          item.status = "sold";
        }
        if (req.auth.role === "charity" && item.forCharity) {
          item.charityClaimCount = Number(item.charityClaimCount || 0) + requestedQty;
          const earned = requestedQty * CHARITY_CREDIT_PER_ITEM;
          charityCreditsByStore.set(
            item.storeId,
            (charityCreditsByStore.get(item.storeId) || 0) + earned
          );
        }
        await item.save();
      }

      // Create order
      const orderUser = await User.findOne({ id: req.auth.sub });
      const dropName = orderUser?.organizationName || orderUser?.name || "Customer";
      const dropAddress = orderUser?.address || "Address not provided";

      const order = await Order.create({
        id: createId("ord"),
        itemId: "multi",
        userId: req.auth.sub,
        status: "pending",
        code: String(Math.floor(1000 + Math.random() * 9000)),
        timestamp: nowIso(),
        items: selectedItems.map((item) => item.toObject()),
        totalAmount: selectedItems.reduce((sum, item) => sum + Number(item.discountPrice || 0), 0),
      });

      // Create delivery tasks grouped by store
      const groupedByStore = selectedItems.reduce((acc, item) => {
        const key = item.storeId || item.storeName;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      for (const storeItems of Object.values(groupedByStore)) {
        const storeName = storeItems[0]?.storeName || "Store";
        const itemsSummary = storeItems.map((i) => i.title).join(", ");
        await Task.create({
          id: createId("t"),
          storeName,
          pickupAddress: `${storeName} pickup point`,
          dropAddress,
          charityName: dropName,
          weight: `${storeItems.length} bags`,
          status: "pending",
          itemsSummary,
        });
      }

      // Award charity credits to retailers
      for (const [storeId, earnedCredits] of charityCreditsByStore.entries()) {
        const storeUser = await User.findOne({ id: storeId });
        if (!storeUser) continue;
        storeUser.creditPoints = Number(storeUser.creditPoints || 0) + earnedCredits;
        storeUser.charityPointsGained =
          Number(storeUser.charityPointsGained || 0) + earnedCredits;
        await storeUser.save();
        await Item.updateMany(
          { storeId },
          { storeCreditPoints: storeUser.creditPoints }
        );
      }

      return res.status(201).json(order.toObject());
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/orders/my", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.auth.sub })
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// ── Charities ────────────────────────────────────────────────────────────────
app.get("/api/charities", async (_req, res, next) => {
  try {
    const charities = await Charity.find().lean();
    res.json(charities);
  } catch (error) {
    next(error);
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
app.get("/api/tasks", requireAuth, async (req, res, next) => {
  try {
    if (!["volunteer", "admin"].includes(req.auth.role)) {
      return res.status(403).json({ message: "Only volunteers can access tasks" });
    }
    const tasks = await Task.find().sort({ createdAt: -1 }).lean();
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.patch(
  "/api/tasks/:id",
  requireAuth,
  requireRole("volunteer", "admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body || {};
      if (!["pending", "accepted", "completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const task = await Task.findOne({ id: req.params.id });
      if (!task) return res.status(404).json({ message: "Task not found" });
      task.status = status;
      await task.save();
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// ── AI ────────────────────────────────────────────────────────────────────────
app.post("/api/ai/predict-expiry", async (req, res) => {
  const { itemName, category } = req.body || {};
  if (!itemName || !category) {
    return res.status(400).json({ message: "itemName and category are required" });
  }
  if (!aiClient) {
    return res.json({ expiryHours: 24, tags: ["Fresh", "Rescued", "Tasty"], impactCO2: 0.5 });
  }
  try {
    const prompt = `
      Analyze the food item "${itemName}" in category "${category}".
      Return a JSON object with:
      1. "expiryHours": estimated hours until it spoils if left at room temp (conservative estimate).
      2. "tags": Array of 3 short marketing tags.
      3. "impactCO2": estimated kg of CO2 prevented by rescuing 1kg of this food.
      Output ONLY valid JSON.
    `;
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const output = JSON.parse(response.text || "{}");
    return res.json({
      expiryHours: Number(output.expiryHours || 24),
      tags: Array.isArray(output.tags) ? output.tags : ["Fresh", "Rescued", "Tasty"],
      impactCO2: Number(output.impactCO2 || 0.5),
    });
  } catch {
    return res.json({ expiryHours: 24, tags: ["Fresh", "Rescued", "Tasty"], impactCO2: 0.5 });
  }
});

app.post("/api/ai/suggest-recipe", async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if (items.length === 0) return res.status(400).json({ message: "items are required" });
  if (!aiClient) {
    return res.json({ text: "Mix them together for a surprise stew!" });
  }
  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest a simple recipe name and 1-sentence description using these leftover ingredients: ${items.join(", ")}.`,
    });
    return res.json({ text: response.text || "Mix them together for a surprise stew!" });
  } catch {
    return res.json({ text: "Mix them together for a surprise stew!" });
  }
});

// ── Contact ───────────────────────────────────────────────────────────────────
app.post("/api/contact", async (req, res, next) => {
  try {
    const { name, email, message } = req.body || {};
    assertRequired(name, "Name is required");
    assertRequired(email, "Email is required");
    assertRequired(message, "Message is required");

    await ContactMessage.create({
      id: createId("msg"),
      name: String(name).trim(),
      email: String(email).trim(),
      message: String(message).trim(),
    });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = error.message || "Internal server error";
  res.status(status).json({ message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT || 8787);

connectDb()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`EcoFeast backend running on http://0.0.0.0:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
