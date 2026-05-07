import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import { connectDb } from "./db.js";
import User from "./models/User.js";
import Item from "./models/Item.js";
import Order from "./models/Order.js";
import Task from "./models/Task.js";
import Charity from "./models/Charity.js";
import ContactMessage from "./models/ContactMessage.js";
import Counter from "./models/Counter.js";

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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const CHARITY_CREDIT_PER_ITEM = Number(process.env.CHARITY_CREDIT_PER_ITEM || 5);
const aiClient = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

const nowIso = () => new Date().toISOString();
const createId = (prefix) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

function computeAggregateOrderStatus(taskStatuses) {
  const statuses = Array.isArray(taskStatuses) ? taskStatuses : [];
  if (statuses.length === 0) return "pending";
  if (statuses.every((s) => s === "completed")) return "completed";
  if (statuses.some((s) => s === "picked_up")) return "picked_up";
  if (statuses.some((s) => s === "accepted")) return "accepted";
  if (statuses.some((s) => s === "ready")) return "ready";
  if (statuses.some((s) => s === "packed")) return "packed";
  if (statuses.some((s) => s === "received")) return "received";
  if (statuses.every((s) => s === "cancelled")) return "cancelled";
  return "pending";
}

async function recomputeAndPersistOrderStatus(orderId) {
  if (!orderId) return null;
  const tasks = await Task.find({ orderId }).lean();
  const nextStatus = computeAggregateOrderStatus(tasks.map((t) => t.status));
  const order = await Order.findOne({ id: orderId });
  if (!order) return null;
  
  const STATUS_WEIGHT = {
    "pending": 1,
    "received": 2,
    "packed": 3,
    "ready": 4,
    "accepted": 5,
    "picked_up": 6,
    "completed": 7,
    "cancelled": 0
  };

  const currentLastStatusWeight = STATUS_WEIGHT[order.lastStatus || 'pending'] || 1;
  const nextStatusWeight = STATUS_WEIGHT[nextStatus] || 1;
  const oldStatusWeight = STATUS_WEIGHT[order.status || 'pending'] || 1;

  if (nextStatus !== "cancelled") {
    if (nextStatusWeight > currentLastStatusWeight) {
      order.lastStatus = nextStatus;
    }
  } else {
    if (oldStatusWeight > currentLastStatusWeight) {
      order.lastStatus = order.status;
    }
  }
  
  order.status = nextStatus;

  // Generate delivery OTP if order becomes ready and doesn't have one
  if (nextStatus === 'ready' && !order.deliveryOtp) {
    order.deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
  }

  await order.save();
  return order.toObject();
}

async function getNextOrderCode() {
  const counter = await Counter.findByIdAndUpdate(
    'orderCode',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return String(counter.seq).padStart(4, '0');
}

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

app.patch("/api/auth/profile", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.auth.sub });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, phone, address, organizationName, vehicleType } = req.body || {};

    if (email) {
      const normalizedEmail = String(email).toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ message: "Invalid email format." });
      }
      const existing = await User.findOne({ email: normalizedEmail, id: { $ne: user.id } });
      if (existing) return res.status(409).json({ message: "Email already in use by another account." });
      user.email = normalizedEmail;
    }
    if (phone !== undefined) {
      const cleaned = String(phone).replace(/\D/g, '');
      if (cleaned && cleaned.length !== 10) {
        return res.status(400).json({ message: "Mobile number must be exactly 10 digits." });
      }
      user.phone = cleaned || null;
    }
    if (name !== undefined) user.name = String(name).trim();
    if (address !== undefined) user.address = String(address).trim() || null;
    if (organizationName !== undefined) user.organizationName = String(organizationName).trim() || null;
    if (vehicleType !== undefined) user.vehicleType = String(vehicleType).trim() || null;

    await user.save();
    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/change-password", requireAuth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    assertRequired(oldPassword, "Current password is required");
    assertRequired(newPassword, "New password is required");

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findOne({ id: req.auth.sub });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!bcrypt.compareSync(String(oldPassword), user.passwordHash)) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    user.passwordHash = bcrypt.hashSync(String(newPassword), 10);
    await user.save();
    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    next(error);
  }
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

app.get("/api/items/my", requireAuth, requireRole("retailer", "admin"), async (req, res, next) => {
  try {
    const storeId = req.auth.sub;
    const items = await Item.find({ storeId }).sort({ createdAt: -1 }).lean();
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

      if (aiClient) {
        try {
          const prompt = `Item: "${title}" (${category}) - ${description}. Is this edible food/grocery? Reply ONLY with JSON {"isFood": true/false}`;
          const response = await aiClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const output = JSON.parse(response.choices[0]?.message?.content || "{}");
          if (output.isFood === false) {
             return res.status(400).json({ message: "Item rejected: Only food items are allowed." });
          }
        } catch (err) {
          console.error("AI food validation failed:", err);
        }
      }

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
          : "/custom-placeholder.png",
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

      // Broadcast new item to all connected clients
      io.emit("new-item", item.toObject());

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
      if (category !== undefined) item.category = String(category);

      if ((title !== undefined || description !== undefined || category !== undefined) && aiClient) {
        try {
          const prompt = `Item: "${item.title}" (${item.category}) - ${item.description}. Is this edible food/grocery? Reply ONLY with JSON {"isFood": true/false}`;
          const response = await aiClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const output = JSON.parse(response.choices[0]?.message?.content || "{}");
          if (output.isFood === false) {
             return res.status(400).json({ message: "Item update rejected: Only food items are allowed." });
          }
        } catch (err) {
          console.error("AI food validation failed:", err);
        }
      }

      if (originalPrice !== undefined) item.originalPrice = Number(originalPrice);
      if (discountPrice !== undefined) item.discountPrice = Number(discountPrice);
      if (image !== undefined) item.image = String(image || item.image);
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

      const orderCode = await getNextOrderCode();
      const order = await Order.create({
        id: createId("ord"),
        itemId: "multi",
        userId: req.auth.sub,
        status: "pending",
        code: orderCode,
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
        const storeName = storeItems[0]?.storeName || "HELLO WORLD";
        const storeId = storeItems[0]?.storeId || null;
        const itemsSummary = storeItems.map((i) => i.title).join(", ");
        const task = await Task.create({
          id: createId("t"),
          orderId: order.id,
          storeId,
          storeName,
          pickupAddress: `${storeName} pickup point`,
          dropAddress,
          charityName: dropName,
          weight: `${storeItems.length} bags`,
          status: "pending",
          itemsSummary,
          items: storeItems.map(i => (i.toObject ? i.toObject() : i)),
        });

        io.emit("new-order", {
          storeId,
          orderId: order.id,
          code: orderCode,
          status: task.status,
          totalQty: storeItems.length,
          pickupStart: storeItems[0]?.pickupStart || null,
          pickupEnd: storeItems[0]?.pickupEnd || null,
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

      io.emit("order-updated", order.toObject());

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
app.get(
  "/api/orders/fulfillment",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const storeId = req.auth.sub;
      const storeUser = await User.findOne({ id: storeId }).lean();
      const storeNames = [storeUser?.organizationName, storeUser?.name]
        .filter(Boolean)
        .map((v) => String(v));

      const orders = await Order.find({ "items.storeId": storeId })
        .sort({ createdAt: -1 })
        .lean();

      if (orders.length === 0) return res.json({ orders: [], tasks: [] });

      const orderIds = orders.map((o) => o.id);
      const tasks = await Task.find({
        $or: [
          { orderId: { $in: orderIds }, storeId },
          { orderId: { $in: orderIds }, storeId: null, storeName: { $in: storeNames } },
        ],
      }).lean();

      const taskByOrderId = new Map(tasks.map((t) => [t.orderId, t]));

      const payload = orders.map((order) => {
        const storeItems = Array.isArray(order.items)
          ? order.items.filter((i) => i?.storeId === storeId)
          : [];
        return {
          order,
          storeItems,
          pickupStart: storeItems[0]?.pickupStart || null,
          pickupEnd: storeItems[0]?.pickupEnd || null,
          totalQty: storeItems.length,
          totalAmount: storeItems.reduce((sum, item) => sum + Number(item?.discountPrice || 0), 0),
          task: taskByOrderId.get(order.id) || null,
        };
      });

      res.json({ orders: payload, tasks });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/orders/:orderId/confirm-pickup",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const { code } = req.body || {};
      const order = await Order.findOne({ id: req.params.orderId });
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.code !== code) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Update all tasks for this store in this order to completed
      const storeId = req.auth.sub;
      const tasks = await Task.find({ orderId: order.id });
      
      // We only complete tasks belonging to the current retailer
      const storeUser = await User.findOne({ id: storeId }).lean();
      const storeNames = [storeUser?.organizationName, storeUser?.name].filter(Boolean);

      for (const task of tasks) {
        const matchesStore = task.storeId === storeId || storeNames.includes(task.storeName);
        if (matchesStore) {
          task.status = "completed";
          await task.save();
          io.emit("task-updated", task.toObject());
        }
      }

      const updatedOrder = await recomputeAndPersistOrderStatus(order.id);
      if (updatedOrder) {
        io.emit("order-updated", updatedOrder);
      } else {
        io.emit("order-updated", order.toObject());
      }
      
      return res.status(200).json({ message: "Pickup confirmed successfully" });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/orders/store",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const storeId =
        req.auth.role === "admin" ? String(req.query.storeId || "").trim() : req.auth.sub;
      if (!storeId && req.auth.role === "admin") {
        return res.status(400).json({ message: "storeId query param is required for admin" });
      }

      const orders = await Order.find({ "items.storeId": storeId })
        .sort({ createdAt: -1 })
        .lean();

      const orderIds = orders.map((o) => o.id);
      let tasksQuery = { orderId: { $in: orderIds }, storeId };
      if (req.auth.role === "retailer") {
        const storeUser = await User.findOne({ id: storeId }).lean();
        const storeNames = [storeUser?.organizationName, storeUser?.name]
          .filter(Boolean)
          .map((v) => String(v));
        tasksQuery = {
          orderId: { $in: orderIds },
          $or: [{ storeId }, { storeId: null, storeName: { $in: storeNames } }],
        };
      }
      const tasks = await Task.find(tasksQuery).lean();
      const taskByOrderId = new Map(tasks.map((t) => [t.orderId, t]));

      const payload = orders.map((order) => {
        const storeItems = Array.isArray(order.items)
          ? order.items.filter((i) => i?.storeId === storeId)
          : [];
        const pickupStart = storeItems[0]?.pickupStart || null;
        const pickupEnd = storeItems[0]?.pickupEnd || null;
        const totalQty = storeItems.length;
        const totalAmount = storeItems.reduce(
          (sum, item) => sum + Number(item?.discountPrice || 0),
          0
        );
        return {
          order,
          storeItems,
          pickupStart,
          pickupEnd,
          totalQty,
          totalAmount,
          task: taskByOrderId.get(order.id) || null,
        };
      });

      res.json(payload);
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/orders/:id/confirm-pickup",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const storeId =
        req.auth.role === "admin" ? String(req.body?.storeId || "").trim() : req.auth.sub;
      if (!storeId && req.auth.role === "admin") {
        return res.status(400).json({ message: "storeId is required for admin" });
      }

      const { code } = req.body || {};
      assertRequired(code, "Pickup code is required");

      const order = await Order.findOne({ id: req.params.id });
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (String(order.code) !== String(code)) {
        return res.status(400).json({ message: "Invalid pickup code" });
      }

      const storeItems = Array.isArray(order.items)
        ? order.items.filter((i) => i?.storeId === storeId)
        : [];
      if (storeItems.length === 0) {
        return res.status(403).json({ message: "This order does not include your store items" });
      }

      let task = await Task.findOne({ orderId: order.id, storeId });
      if (!task) {
        const storeUser = await User.findOne({ id: storeId }).lean();
        const storeNames = [storeUser?.organizationName, storeUser?.name]
          .filter(Boolean)
          .map((v) => String(v));
        task = await Task.findOne({
          orderId: order.id,
          storeId: null,
          storeName: { $in: storeNames },
        });
      }
      if (!task) return res.status(404).json({ message: "Store task not found" });
      if (task.status !== "ready") {
        return res.status(409).json({ message: "Task must be READY before confirming pickup" });
      }

      task.status = "accepted";
      await task.save();

      const updatedOrder = await recomputeAndPersistOrderStatus(order.id);
      if (updatedOrder) io.emit("order-updated", updatedOrder);
      io.emit("task-updated", task.toObject());

      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/orders/:id/cancel-store",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const storeId =
        req.auth.role === "admin" ? String(req.body?.storeId || "").trim() : req.auth.sub;
      if (!storeId && req.auth.role === "admin") {
        return res.status(400).json({ message: "storeId is required for admin" });
      }

      const order = await Order.findOne({ id: req.params.id });
      if (!order) return res.status(404).json({ message: "Order not found" });

      const storeItems = Array.isArray(order.items)
        ? order.items.filter((i) => i?.storeId === storeId)
        : [];
      if (storeItems.length === 0) {
        return res.status(403).json({ message: "This order does not include your store items" });
      }

      let task = await Task.findOne({ orderId: order.id, storeId });
      if (!task) {
        const storeUser = await User.findOne({ id: storeId }).lean();
        const storeNames = [storeUser?.organizationName, storeUser?.name]
          .filter(Boolean)
          .map((v) => String(v));
        task = await Task.findOne({
          orderId: order.id,
          storeId: null,
          storeName: { $in: storeNames },
        });
      }
      if (!task) return res.status(404).json({ message: "Store task not found" });
      if (["accepted", "completed", "cancelled"].includes(task.status)) {
        return res.status(409).json({ message: `Cannot cancel: Task is already ${task.status}` });
      }

      // Restock original items based on storeItems snapshot
      const qtyByItemId = new Map();
      for (const item of storeItems) {
        if (!item?.id) continue;
        qtyByItemId.set(item.id, (qtyByItemId.get(item.id) || 0) + 1);
      }
      for (const [itemId, qty] of qtyByItemId.entries()) {
        const dbItem = await Item.findOne({ id: itemId });
        if (!dbItem) continue;
        dbItem.quantity = Number(dbItem.quantity || 0) + Number(qty || 0);
        if (dbItem.quantity > 0) dbItem.status = "available";
        await dbItem.save();
      }

      // Capture the task's current status BEFORE cancellation
      // This is the definitive record of how far the order progressed
      const taskStatusBeforeCancel = task.status;
      order.lastStatus = taskStatusBeforeCancel;
      await order.save();

      task.status = "cancelled";
      await task.save();

      const updatedOrder = await recomputeAndPersistOrderStatus(order.id);
      if (updatedOrder) io.emit("order-updated", updatedOrder);
      io.emit("task-updated", task.toObject());

      return res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

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

app.get(
  "/api/tasks/my",
  requireAuth,
  requireRole("consumer", "charity", "admin"),
  async (req, res, next) => {
    try {
      const userId = req.auth.sub;
      const orders = await Order.find({ userId }).select({ id: 1 }).lean();
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length === 0) return res.json([]);
      const tasks = await Task.find({ orderId: { $in: orderIds } })
        .sort({ createdAt: -1 })
        .lean();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/orders/:id/tasks", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOne({ id: req.params.id }).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.auth.role !== "admin" && order.userId !== req.auth.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const tasks = await Task.find({ orderId: order.id }).sort({ createdAt: -1 }).lean();
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.get(
  "/api/tasks/store",
  requireAuth,
  requireRole("retailer", "admin"),
  async (req, res, next) => {
    try {
      const storeId =
        req.auth.role === "admin" ? String(req.query.storeId || "").trim() : req.auth.sub;
      if (!storeId && req.auth.role === "admin") {
        return res.status(400).json({ message: "storeId query param is required for admin" });
      }

      let query = { storeId };
      if (req.auth.role === "retailer") {
        const storeUser = await User.findOne({ id: storeId }).lean();
        const storeNames = [storeUser?.organizationName, storeUser?.name]
          .filter(Boolean)
          .map((v) => String(v));
        query = {
          $or: [{ storeId }, { storeId: null, storeName: { $in: storeNames } }],
        };
      }

      const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }
);

app.patch(
  "/api/tasks/:id",
  requireAuth,
  requireRole("volunteer", "retailer", "admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body || {};
      if (!["pending", "received", "packed", "ready", "accepted", "picked_up", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const task = await Task.findOne({ id: req.params.id });
      if (!task) return res.status(404).json({ message: "Task not found" });

      if (req.auth.role === "volunteer" && !["accepted", "picked_up", "completed"].includes(status)) {
        return res.status(403).json({ message: "Volunteers can only accept, pick up, or complete tasks" });
      }
      if (req.auth.role === "retailer") {
        if (!["received", "packed", "ready", "cancelled"].includes(status)) {
          return res.status(403).json({ message: "Retailers can only mark tasks as received, packed, ready or cancelled" });
        }
        if (task.storeId && task.storeId !== req.auth.sub) {
          return res.status(403).json({ message: "You can only update tasks for your store" });
        }
        if (!task.storeId) {
          const storeUser = await User.findOne({ id: req.auth.sub }).lean();
          const storeNames = [storeUser?.organizationName, storeUser?.name]
            .filter(Boolean)
            .map((v) => String(v));
          if (!storeNames.includes(String(task.storeName || ""))) {
            return res.status(403).json({ message: "You can only update tasks for your store" });
          }
        }
      }

      task.status = status;

      if (req.auth.role === "volunteer") {
        const volunteerUser = await User.findOne({ id: req.auth.sub }).lean();
        if (volunteerUser) {
          task.volunteerId = volunteerUser.id;
          task.volunteerName = volunteerUser.name || null;
          task.volunteerPhone = volunteerUser.phone || null;
          task.volunteerVehicleType = volunteerUser.vehicleType || null;
        }
      }
      await task.save();



      if (task.orderId) {
        const updatedOrder = await recomputeAndPersistOrderStatus(task.orderId);
        if (updatedOrder) io.emit("order-updated", updatedOrder);
      }

      io.emit("task-updated", task.toObject());
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// ── Tasks ─────────────────────────────────────────────────────────────────────
app.post(
  "/api/tasks/:id/deliver",
  requireAuth,
  requireRole("volunteer", "admin"),
  async (req, res, next) => {
    try {
      const { otp } = req.body || {};
      const task = await Task.findOne({ id: req.params.id });
      if (!task) return res.status(404).json({ message: "Task not found" });
      if (task.status !== "picked_up") {
        return res.status(400).json({ message: "Task must be picked up before delivery" });
      }

      const order = await Order.findOne({ id: task.orderId });
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.deliveryOtp !== otp && order.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      task.status = "completed";
      await task.save();

      const updatedOrder = await recomputeAndPersistOrderStatus(order.id);
      if (updatedOrder) io.emit("order-updated", updatedOrder);
      io.emit("task-updated", task.toObject());

      return res.json({ ok: true });
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
    const response = await aiClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const output = JSON.parse(response.choices[0]?.message?.content || "{}");
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
    const response = await aiClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: `Suggest a simple recipe name and 1-sentence description using these leftover ingredients: ${items.join(", ")}.` }],
    });
    return res.json({ text: response.choices[0]?.message?.content || "Mix them together for a surprise stew!" });
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

// ── Background Tasks ──────────────────────────────────────────────────────────
async function runAutoCleanup() {
  if (!aiClient) return;
  try {
    console.log("[Auto-Cleanup] Starting background scan for non-food items...");
    const items = await Item.find({});
    console.log(`[Auto-Cleanup] Found ${items.length} items to scan.`);
    let removedCount = 0;
    
    for (const item of items) {
      console.log(`[Auto-Cleanup] Checking: "${item.title}" (${item.category})`);
      const prompt = `You are a strict food safety filter. Is "${item.title}" an edible food item, grocery, or meal? A helmet, phone, laptop, clothing, electronics, etc. are NOT food. Reply ONLY with JSON: {"isFood":true} or {"isFood":false}`;
      
      let attempts = 0;
      let success = false;
      while (attempts < 2 && !success) {
        attempts++;
        try {
          const response = await aiClient.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          });
          const text = response.choices[0]?.message?.content || "{}";
          console.log(`[Auto-Cleanup]   AI response: ${text.trim()}`);
          const output = JSON.parse(text);
          if (output.isFood === false) {
            console.log(`[Auto-Cleanup]   ❌ MISCHIEF DETECTED: Removing "${item.title}"`);
            await Item.findByIdAndDelete(item._id);
            removedCount++;
          } else {
            console.log(`[Auto-Cleanup]   ✅ Valid food.`);
          }
          success = true;
        } catch (aiErr) {
          console.log(`[Auto-Cleanup]   ⚠ Attempt ${attempts} failed: ${aiErr.message?.slice(0, 80)}`);
          if (attempts < 2) {
            console.log(`[Auto-Cleanup]   Retrying in 15s...`);
            await new Promise(r => setTimeout(r, 15000));
          }
        }
      }
      // Wait 12 seconds between items to respect rate limits
      await new Promise(r => setTimeout(r, 12000));
    }
    console.log(`[Auto-Cleanup] Scan complete. Removed ${removedCount} items.`);
  } catch (err) {
    console.error("[Auto-Cleanup] Error:", err.message);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT || 8787);

connectDb()
  .then(() => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`EcoFeast backend running on http://0.0.0.0:${port}`);
      
      // Auto-cleanup disabled to conserve Groq API quota.
      // To run manually: node backend/cleanup.js
      // setInterval(runAutoCleanup, 21600000);
      // setTimeout(runAutoCleanup, 60000);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
