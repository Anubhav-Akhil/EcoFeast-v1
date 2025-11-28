export type UserRole = 'consumer' | 'retailer' | 'charity' | 'volunteer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  ecoPoints?: number; // For consumers
  creditPoints?: number; // For retailers (formerly charityPoints)
  organizationName?: string; // For retailer/charity
  location?: { lat: number; lng: number; address: string };
  address?: string;
  phone?: string;
  vehicleType?: string; // For volunteer
}

export interface Item {
  id: string;
  storeId: string;
  storeName: string;
  storeCreditPoints?: number; // Used for sorting rank
  title: string;
  description: string;
  originalPrice: number;
  discountPrice: number; // 0 for charity donations
  image: string;
  category: 'bakery' | 'meals' | 'produce' | 'grocery' | 'compost';
  tags: string[];
  expiry: string; // ISO date
  pickupStart: string;
  pickupEnd: string;
  quantity: number;
  status: 'available' | 'reserved' | 'sold' | 'donated' | 'composted';
  distance?: string; // Calculated on client
  forAnimalFeed?: boolean;
}

export interface Reservation {
  id: string;
  itemId: string;
  userId: string;
  status: 'pending' | 'ready' | 'completed' | 'cancelled';
  code: string; // Pickup code
  timestamp: string;
  items?: Item[]; // For cart orders
  totalAmount?: number;
}

export interface Task {
  id: string;
  storeName: string;
  pickupAddress: string;
  dropAddress: string;
  charityName: string;
  weight: string; // e.g. "5kg"
  status: 'pending' | 'accepted' | 'completed';
  itemsSummary: string;
}

export interface StatMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface Charity {
  id: string;
  name: string;
  mission: string;
  lat: number;
  lng: number;
  image: string;
  description?: string;
  contact?: string;
}