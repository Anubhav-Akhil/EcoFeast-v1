import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.cwd(), "backend", "data");
const dataFile = process.env.DB_FILE || path.join(dataDir, "ecofeast.json");

function nowIso() {
  return new Date().toISOString();
}

function createInitialData() {
  return {
    users: [],
    items: [
      {
        id: "1",
        storeId: "s1",
        storeName: "Green Valley Grocer",
        storeCreditPoints: 120,
        title: "Surprise Veggie Bag",
        description: "Assorted seasonal vegetables.",
        originalPrice: 500,
        discountPrice: 150,
        image: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=400&q=80",
        category: "produce",
        tags: ["Vegan", "Healthy"],
        expiry: new Date(Date.now() + 86400000).toISOString(),
        pickupStart: "18:00",
        pickupEnd: "20:00",
        quantity: 5,
        status: "available",
        forAnimalFeed: false,
        forCharity: false,
        rescuedCount: 0,
        charityClaimCount: 0,
        createdAt: nowIso(),
      },
      {
        id: "2",
        storeId: "s2",
        storeName: "Crust & Crumb",
        storeCreditPoints: 45,
        title: "Day-old Pastry Box",
        description: "Croissants, muffins, and danishes.",
        originalPrice: 600,
        discountPrice: 200,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
        category: "bakery",
        tags: ["Sweet", "Contains Gluten"],
        expiry: new Date(Date.now() + 43200000).toISOString(),
        pickupStart: "17:00",
        pickupEnd: "19:00",
        quantity: 3,
        status: "available",
        forAnimalFeed: false,
        forCharity: false,
        rescuedCount: 0,
        charityClaimCount: 0,
        createdAt: nowIso(),
      },
      {
        id: "3",
        storeId: "s3",
        storeName: "City Bistro",
        storeCreditPoints: 300,
        title: "Leftover Lunch Boxes",
        description: "Gourmet pasta and salad.",
        originalPrice: 400,
        discountPrice: 0,
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
        category: "meals",
        tags: ["Hot Food", "Donation"],
        expiry: new Date(Date.now() + 20000000).toISOString(),
        pickupStart: "15:00",
        pickupEnd: "16:00",
        quantity: 10,
        status: "available",
        forAnimalFeed: false,
        forCharity: true,
        rescuedCount: 0,
        charityClaimCount: 0,
        createdAt: nowIso(),
      },
      {
        id: "4",
        storeId: "s1",
        storeName: "Green Valley Grocer",
        storeCreditPoints: 120,
        title: "Canned Goods Bundle",
        description: "Beans, corn, and soup cans near expiry.",
        originalPrice: 800,
        discountPrice: 250,
        image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80",
        category: "grocery",
        tags: ["Pantry", "Long Life"],
        expiry: new Date(Date.now() + 100000000).toISOString(),
        pickupStart: "09:00",
        pickupEnd: "21:00",
        quantity: 2,
        status: "available",
        forAnimalFeed: false,
        forCharity: false,
        rescuedCount: 0,
        charityClaimCount: 0,
        createdAt: nowIso(),
      },
      {
        id: "5",
        storeId: "s4",
        storeName: "Organic Oasis",
        storeCreditPoints: 10,
        title: "Dairy Essentials",
        description: "Yogurt and Milk approaching sell-by date.",
        originalPrice: 550,
        discountPrice: 150,
        image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80",
        category: "grocery",
        tags: ["Dairy", "Cold Chain"],
        expiry: new Date(Date.now() + 172800000).toISOString(),
        pickupStart: "10:00",
        pickupEnd: "14:00",
        quantity: 0,
        status: "available",
        forAnimalFeed: false,
        forCharity: false,
        rescuedCount: 0,
        charityClaimCount: 0,
        createdAt: nowIso(),
      },
    ],
    orders: [],
    tasks: [
      {
        id: "t1",
        storeName: "City Bistro",
        pickupAddress: "123 Main St, Downtown",
        dropAddress: "Food For All, 45 Shelter Rd",
        charityName: "Food For All",
        weight: "12kg",
        status: "pending",
        itemsSummary: "10x Lunch Boxes",
      },
      {
        id: "t2",
        storeName: "Green Valley Grocer",
        pickupAddress: "88 Market Ave",
        dropAddress: "Senior Support, 12 Oak Ln",
        charityName: "Senior Support",
        weight: "8kg",
        status: "pending",
        itemsSummary: "Assorted Veggies",
      },
      {
        id: "t3",
        storeName: "Organic Oasis",
        pickupAddress: "55 Fresh Blvd",
        dropAddress: "Tiny Tummies, 99 School St",
        charityName: "Tiny Tummies",
        weight: "5kg",
        status: "pending",
        itemsSummary: "Milk & Yogurt",
      },
    ],
    charities: [
      {
        id: "c1",
        name: "Food For All",
        mission: "Feeding homeless communities.",
        description: "We operate daily soup kitchens and distribute grocery packs to families in need across the city.",
        contact: "contact@foodforall.org",
        lat: 40.7128,
        lng: -74.006,
        image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "c2",
        name: "Tiny Tummies",
        mission: "School meals for underprivileged kids.",
        description: "Ensuring no child goes to school hungry. We partner with 20+ schools to provide nutritious breakfasts.",
        contact: "hello@tinytummies.org",
        lat: 40.758,
        lng: -73.9855,
        image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "c3",
        name: "Senior Support",
        mission: "Delivering groceries to the elderly.",
        description: "Dedicated to helping housebound seniors access fresh food and social connection.",
        contact: "help@seniorsupport.com",
        lat: 40.7829,
        lng: -73.9654,
        image: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80",
      },
    ],
    contactMessages: [],
  };
}

let state = null;

export function initDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    state = createInitialData();
    saveDb();
    return;
  }

  try {
    state = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
    // Light migration for older persisted snapshots.
    state.users = (state.users || []).map((u) => ({
      ...u,
      charityPointsGained: Number(u.charityPointsGained || 0),
      creditPoints: Number(u.creditPoints || 0),
      ecoPoints: Number(u.ecoPoints || 0),
    }));
    state.items = (state.items || []).map((i) => ({
      ...i,
      forAnimalFeed: !!i.forAnimalFeed,
      forCharity: !!i.forCharity,
      rescuedCount: Number(i.rescuedCount || 0),
      charityClaimCount: Number(i.charityClaimCount || 0),
      storeCreditPoints: Number(i.storeCreditPoints || 0),
    }));
  } catch {
    state = createInitialData();
    saveDb();
  }
}

export function getDb() {
  if (!state) initDb();
  return state;
}

export function saveDb() {
  fs.writeFileSync(dataFile, JSON.stringify(state, null, 2), "utf-8");
}
