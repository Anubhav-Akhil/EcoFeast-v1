import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { getDb, initDb, saveDb } from "./db.js";

dotenv.config();
initDb();

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
const createId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
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
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ecoPoints: user.ecoPoints || 0,
    creditPoints: user.creditPoints || 0,
    organizationName: user.organizationName || undefined,
    phone: user.phone || undefined,
    address: user.address || undefined,
    vehicleType: user.vehicleType || undefined,
    charityPointsGained: user.charityPointsGained || 0,
  };
}

function syncStoreCreditPoints(db, storeId, creditPoints) {
  for (const item of db.items) {
    if (item.storeId === storeId) {
      item.storeCreditPoints = Number(creditPoints || 0);
    }
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: nowIso() });
});

app.post("/api/auth/signup", (req, res, next) => {
  try {
    const db = getDb();
    const { email, password, role, name, orgName, phone, address, vehicleType } = req.body || {};
    assertRequired(email, "Email is required");
    assertRequired(password, "Password is required");
    assertRequired(role, "Role is required");

    const normalizedEmail = String(email).toLowerCase().trim();
    if (db.users.some((u) => u.email === normalizedEmail)) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const resolvedName =
      role === "retailer" || role === "charity" ? orgName : name || normalizedEmail.split("@")[0];
    assertRequired(resolvedName, "Name is required");

    const user = {
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
      createdAt: nowIso(),
    };

    db.users.push(user);
    saveDb();

    const token = signToken(user);
    res.status(201).json({ user: toPublicUser(user), token });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", (req, res, next) => {
  try {
    const db = getDb();
    const { email, password } = req.body || {};
    assertRequired(email, "Email is required");
    assertRequired(password, "Password is required");

    const user = db.users.find((u) => u.email === String(email).toLowerCase().trim());
    if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user);
    res.json({ user: toPublicUser(user), token });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const db = getDb();
  const user = db.users.find((u) => u.id === req.auth.sub);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user: toPublicUser(user) });
});

app.get("/api/items", (_req, res) => {
  const db = getDb();
  const items = [...db.items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(items);
});

app.post("/api/items", requireAuth, requireRole("retailer", "admin"), (req, res, next) => {
  try {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.auth.sub);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      title,
      description,
      originalPrice,
      discountPrice,
      image,
      category,
      tags,
      expiry,
      pickupStart,
      pickupEnd,
      quantity,
      forAnimalFeed,
      forCharity,
    } = req.body || {};

    assertRequired(title, "Title is required");
    assertRequired(description, "Description is required");
    assertRequired(category, "Category is required");
    assertRequired(pickupStart, "Pickup start is required");
    assertRequired(pickupEnd, "Pickup end is required");

    const item = {
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
      createdAt: nowIso(),
    };

    db.items.unshift(item);
    saveDb();
    return res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/items/:id", requireAuth, requireRole("retailer", "admin"), (req, res) => {
  const db = getDb();
  const idx = db.items.findIndex((item) => item.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Item not found" });

  const item = db.items[idx];
  if (req.auth.role !== "admin" && item.storeId !== req.auth.sub) {
    return res.status(403).json({ message: "You can only delete your own items" });
  }

  db.items.splice(idx, 1);
  saveDb();
  return res.status(204).send();
});

app.patch("/api/items/:id", requireAuth, requireRole("retailer", "admin"), (req, res, next) => {
  try {
    const db = getDb();
    const item = db.items.find((row) => row.id === req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (req.auth.role !== "admin" && item.storeId !== req.auth.sub) {
      return res.status(403).json({ message: "You can only update your own items" });
    }

    const {
      title,
      description,
      originalPrice,
      discountPrice,
      image,
      category,
      tags,
      expiry,
      pickupStart,
      pickupEnd,
      quantity,
      quantityDelta,
      forAnimalFeed,
      forCharity,
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

    if (item.forCharity) {
      item.discountPrice = 0;
    }

    if (quantity !== undefined) {
      item.quantity = Math.max(0, Number(quantity));
    }
    if (quantityDelta !== undefined) {
      item.quantity = Math.max(0, Number(item.quantity || 0) + Number(quantityDelta));
    }

    item.status = item.quantity <= 0 ? "sold" : "available";
    item.updatedAt = nowIso();

    saveDb();
    return res.json(item);
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", requireAuth, requireRole("consumer", "charity", "admin"), (req, res) => {
  const db = getDb();
  const inputItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (inputItems.length === 0) {
    return res.status(400).json({ message: "At least one item is required" });
  }

  const quantityByItemId = new Map();
  for (const payloadItem of inputItems) {
    const itemId = payloadItem?.id;
    if (!itemId) continue;
    quantityByItemId.set(itemId, (quantityByItemId.get(itemId) || 0) + 1);
  }

  const selectedItems = [];
  for (const [itemId, requestedQty] of quantityByItemId.entries()) {
    const item = db.items.find((row) => row.id === itemId);
    if (!item) return res.status(404).json({ message: "One or more items were not found" });
    if (item.quantity <= 0 || item.quantity < requestedQty) {
      return res.status(409).json({ message: `${item.title} is sold out` });
    }
    for (let i = 0; i < requestedQty; i += 1) {
      selectedItems.push(item);
    }
  }

  const charityCreditsByStore = new Map();

  for (const [itemId, requestedQty] of quantityByItemId.entries()) {
    const item = db.items.find((row) => row.id === itemId);
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
      charityCreditsByStore.set(item.storeId, (charityCreditsByStore.get(item.storeId) || 0) + earned);
    }
  }

  const order = {
    id: createId("ord"),
    itemId: "multi",
    userId: req.auth.sub,
    status: "pending",
    code: String(Math.floor(1000 + Math.random() * 9000)),
    timestamp: nowIso(),
    items: selectedItems.map((item) => ({ ...item })),
    totalAmount: selectedItems.reduce((sum, item) => sum + Number(item.discountPrice || 0), 0),
  };

  db.orders.push(order);

  const user = db.users.find((u) => u.id === req.auth.sub);
  const dropName = user?.organizationName || user?.name || "Customer";
  const dropAddress = user?.address || "Address not provided";
  const groupedByStore = selectedItems.reduce((acc, item) => {
    const key = item.storeId || item.storeName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  for (const storeItems of Object.values(groupedByStore)) {
    const storeName = storeItems[0]?.storeName || "Store";
    const itemsSummary = storeItems.map((item) => item.title).join(", ");
    db.tasks.unshift({
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

  for (const [storeId, earnedCredits] of charityCreditsByStore.entries()) {
    const storeUser = db.users.find((u) => u.id === storeId);
    if (!storeUser) continue;
    storeUser.creditPoints = Number(storeUser.creditPoints || 0) + earnedCredits;
    storeUser.charityPointsGained = Number(storeUser.charityPointsGained || 0) + earnedCredits;
    syncStoreCreditPoints(db, storeId, storeUser.creditPoints);
  }

  saveDb();
  return res.status(201).json(order);
});

app.get("/api/orders/my", requireAuth, (req, res) => {
  const db = getDb();
  const orders = db.orders
    .filter((order) => order.userId === req.auth.sub)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(orders);
});

app.get("/api/charities", (_req, res) => {
  const db = getDb();
  res.json(db.charities);
});

app.get("/api/tasks", requireAuth, (req, res) => {
  if (!["volunteer", "admin"].includes(req.auth.role)) {
    return res.status(403).json({ message: "Only volunteers can access tasks" });
  }
  const db = getDb();
  res.json(db.tasks);
});

app.patch("/api/tasks/:id", requireAuth, requireRole("volunteer", "admin"), (req, res) => {
  const db = getDb();
  const { status } = req.body || {};
  if (!["pending", "accepted", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const task = db.tasks.find((row) => row.id === req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.status = status;
  saveDb();
  return res.status(204).send();
});

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

app.post("/api/contact", (req, res, next) => {
  try {
    const db = getDb();
    const { name, email, message } = req.body || {};
    assertRequired(name, "Name is required");
    assertRequired(email, "Email is required");
    assertRequired(message, "Message is required");

    db.contactMessages.push({
      id: createId("msg"),
      name: String(name).trim(),
      email: String(email).trim(),
      message: String(message).trim(),
      createdAt: nowIso(),
    });
    saveDb();
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

if (process.env.SERVE_STATIC === "true") {
  const distPath = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
}

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = error.message || "Internal server error";
  res.status(status).json({ message });
});

const port = Number(process.env.PORT || 8787);
app.listen(port, "0.0.0.0", () => {
  console.log(`EcoFeast backend running on http://0.0.0.0:${port}`);
});
