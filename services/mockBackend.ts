import { User, Item, Reservation, UserRole, Charity, Task } from '../types';

// --- MOCK DATABASE ---
const STORAGE_KEYS = {
  USERS: 'ecofeast_users',
  ITEMS: 'ecofeast_items',
  RESERVATIONS: 'ecofeast_reservations',
  SESSION: 'ecofeast_session',
  TASKS: 'ecofeast_tasks'
};

const INITIAL_ITEMS: Item[] = [
  {
    id: '1', storeId: 's1', storeName: 'Green Valley Grocer', storeCreditPoints: 120, title: 'Surprise Veggie Bag',
    description: 'Assorted seasonal vegetables.', originalPrice: 500, discountPrice: 150,
    image: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=400&q=80', category: 'produce', tags: ['Vegan', 'Healthy'],
    expiry: new Date(Date.now() + 86400000).toISOString(), pickupStart: '18:00', pickupEnd: '20:00',
    quantity: 5, status: 'available'
  },
  {
    id: '2', storeId: 's2', storeName: 'Crust & Crumb', storeCreditPoints: 45, title: 'Day-old Pastry Box',
    description: 'Croissants, muffins, and danishes.', originalPrice: 600, discountPrice: 200,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80', category: 'bakery', tags: ['Sweet', 'Contains Gluten'],
    expiry: new Date(Date.now() + 43200000).toISOString(), pickupStart: '17:00', pickupEnd: '19:00',
    quantity: 3, status: 'available'
  },
  {
    id: '3', storeId: 's3', storeName: 'City Bistro', storeCreditPoints: 300, title: 'Leftover Lunch Boxes',
    description: 'Gourmet pasta and salad.', originalPrice: 400, discountPrice: 0, // Donation
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80', category: 'meals', tags: ['Hot Food', 'Donation'],
    expiry: new Date(Date.now() + 20000000).toISOString(), pickupStart: '15:00', pickupEnd: '16:00',
    quantity: 10, status: 'available'
  },
  {
    id: '4', storeId: 's1', storeName: 'Green Valley Grocer', storeCreditPoints: 120, title: 'Canned Goods Bundle',
    description: 'Beans, corn, and soup cans near expiry.', originalPrice: 800, discountPrice: 250,
    image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80', category: 'grocery', tags: ['Pantry', 'Long Life'],
    expiry: new Date(Date.now() + 100000000).toISOString(), pickupStart: '09:00', pickupEnd: '21:00',
    quantity: 2, status: 'available'
  },
  {
    id: '5', storeId: 's4', storeName: 'Organic Oasis', storeCreditPoints: 10, title: 'Dairy Essentials',
    description: 'Yogurt and Milk approaching sell-by date.', originalPrice: 550, discountPrice: 150,
    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=400&q=80', category: 'grocery', tags: ['Dairy', 'Cold Chain'],
    expiry: new Date(Date.now() + 172800000).toISOString(), pickupStart: '10:00', pickupEnd: '14:00',
    quantity: 0, status: 'available' 
  }
];

export const INITIAL_CHARITIES: Charity[] = [
  { id: 'c1', name: "Food For All", mission: "Feeding homeless communities.", description: "We operate daily soup kitchens and distribute grocery packs to families in need across the city.", contact: "contact@foodforall.org", lat: 40.7128, lng: -74.0060, image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=400&q=80" },
  { id: 'c2', name: "Tiny Tummies", mission: "School meals for underprivileged kids.", description: "Ensuring no child goes to school hungry. We partner with 20+ schools to provide nutritious breakfasts.", contact: "hello@tinytummies.org", lat: 40.7580, lng: -73.9855, image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=400&q=80" },
  { id: 'c3', name: "Senior Support", mission: "Delivering groceries to the elderly.", description: "Dedicated to helping housebound seniors access fresh food and social connection.", contact: "help@seniorsupport.com", lat: 40.7829, lng: -73.9654, image: "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80" }
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', storeName: 'City Bistro', pickupAddress: '123 Main St, Downtown', dropAddress: 'Food For All, 45 Shelter Rd', charityName: 'Food For All', weight: '12kg', status: 'pending', itemsSummary: '10x Lunch Boxes' },
  { id: 't2', storeName: 'Green Valley Grocer', pickupAddress: '88 Market Ave', dropAddress: 'Senior Support, 12 Oak Ln', charityName: 'Senior Support', weight: '8kg', status: 'pending', itemsSummary: 'Assorted Veggies' },
  { id: 't3', storeName: 'Organic Oasis', pickupAddress: '55 Fresh Blvd', dropAddress: 'Tiny Tummies, 99 School St', charityName: 'Tiny Tummies', weight: '5kg', status: 'pending', itemsSummary: 'Milk & Yogurt' },
];

// --- API SERVICE LAYER ---

export const api = {
  // Auth
  login: async (email: string, role: UserRole, details?: any): Promise<User> => {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    
    const user: User = {
      id: role === 'retailer' ? 's1' : 'u' + Date.now(),
      name: details?.name || email.split('@')[0],
      email,
      role,
      ecoPoints: role === 'consumer' ? 120 : 0,
      creditPoints: role === 'retailer' ? 50 : 0,
      organizationName: role === 'retailer' || role === 'charity' ? details?.orgName || 'New Organization' : undefined,
      phone: details?.phone,
      address: details?.address,
      vehicleType: details?.vehicleType
    };
    
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getSession: (): User | null => {
    const s = localStorage.getItem(STORAGE_KEYS.SESSION);
    return s ? JSON.parse(s) : null;
  },

  // Items
  getItems: async (): Promise<Item[]> => {
    const s = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!s) {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      return INITIAL_ITEMS;
    }
    return JSON.parse(s);
  },

  addItem: async (item: Omit<Item, 'id' | 'status'>): Promise<Item> => {
    const currentSession = api.getSession();
    let currentCreditPoints = 0;
    
    // Simulate fetching store's current credit points
    if (currentSession && currentSession.role === 'retailer') {
         currentCreditPoints = currentSession.creditPoints || 0;
         if (item.discountPrice === 0) {
             currentCreditPoints += 10; // Bonus for donation
             // Update session for immediate UI reflect
             currentSession.creditPoints = currentCreditPoints;
             localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentSession));
         }
    }

    const newItem: Item = { 
        ...item, 
        id: Math.random().toString(36).substr(2, 9), 
        status: 'available',
        storeCreditPoints: currentCreditPoints
    };
    
    const items = await api.getItems();
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    return newItem;
  },

  deleteItem: async (itemId: string): Promise<void> => {
      const items = await api.getItems();
      const newItems = items.filter(i => i.id !== itemId);
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(newItems));
  },

  createOrder: async (userId: string, itemsToOrder: Item[]): Promise<Reservation> => {
      const items = await api.getItems();
      
      // Update inventory
      itemsToOrder.forEach(orderItem => {
          const idx = items.findIndex(i => i.id === orderItem.id);
          if (idx !== -1 && items[idx].quantity > 0) {
              items[idx].quantity -= 1;
          }
      });
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));

      const reservation: Reservation = {
          id: Math.random().toString(36).substr(2, 9),
          itemId: 'multi',
          userId,
          status: 'pending',
          code: Math.floor(1000 + Math.random() * 9000).toString(),
          timestamp: new Date().toISOString(),
          items: itemsToOrder,
          totalAmount: itemsToOrder.reduce((sum, i) => sum + i.discountPrice, 0)
      };

      const resData = localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]';
      const allRes = JSON.parse(resData);
      allRes.push(reservation);
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(allRes));

      return reservation;
  },

  getUserReservations: async (userId: string): Promise<Reservation[]> => {
    const resData = localStorage.getItem(STORAGE_KEYS.RESERVATIONS) || '[]';
    return JSON.parse(resData).filter((r: Reservation) => r.userId === userId);
  },

  // Charities
  getCharities: async (): Promise<Charity[]> => {
    return INITIAL_CHARITIES;
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
      const t = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!t) {
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
          return INITIAL_TASKS;
      }
      return JSON.parse(t);
  },

  updateTaskStatus: async (taskId: string, status: Task['status']): Promise<void> => {
      const tasks = await api.getTasks();
      const idx = tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
          tasks[idx].status = status;
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }
  }
};