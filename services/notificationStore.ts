import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type NotifType = 'new_item' | 'new_order' | 'task_update' | 'order_update' | 'system';

export interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  subtitle?: string;
  emoji?: string;
  timestamp: number;
  read: boolean;
  link?: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 80),
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearAll: () => set({ notifications: [] }),
    }),
    {
      name: 'ecofeast-notifications',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── Human-friendly notification message factory ───────────────────────────────
export function buildNotification(
  type: NotifType,
  context: {
    status?: string;
    itemTitle?: string;
    storeName?: string;
    orderCode?: string;
    volunteerName?: string;
    role?: string;
  }
): Pick<NotificationItem, 'type' | 'title' | 'message' | 'emoji' | 'subtitle'> {
  const { status, itemTitle, storeName, orderCode, volunteerName } = context;

  switch (type) {
    case 'new_item':
      return {
        type,
        emoji: '🛍️',
        title: 'New Surplus Listed',
        message: itemTitle
          ? `${storeName || 'A store'} just added "${itemTitle}" to the marketplace.`
          : `${storeName || 'A local store'} added new surplus items.`,
        subtitle: 'Check Marketplace before it sells out',
      };

    case 'new_order':
      return {
        type,
        emoji: '🧾',
        title: 'New Order Received',
        message: orderCode
          ? `Order #${orderCode} has arrived. Pack it up and mark it ready for pickup.`
          : 'A new order has been placed at your store.',
        subtitle: 'Go to Orders tab to confirm',
      };

    case 'order_update': {
      const map: Record<string, { emoji: string; title: string; message: string; subtitle?: string }> = {
        received: {
          emoji: '📦',
          title: 'Order Acknowledged',
          message: `${storeName || 'The store'} has received your order and started preparing it.`,
          subtitle: orderCode ? `Order #${orderCode} · Usually ready within the hour` : 'Usually ready within the hour',
        },
        packed: {
          emoji: '✅',
          title: 'Order Packed',
          message: 'Your bag is sealed and waiting for a volunteer to pick it up.',
          subtitle: orderCode ? `Order #${orderCode} · A volunteer will be assigned shortly` : 'A volunteer will be assigned shortly',
        },
        ready: {
          emoji: '🔔',
          title: 'Order Ready',
          message: `Your order is packed and ready at ${storeName || 'the store'}. A volunteer is on their way.`,
          subtitle: orderCode ? `Order #${orderCode} · Stay near your delivery address` : 'Stay near your delivery address',
        },
        accepted: {
          emoji: '🚴',
          title: 'Volunteer En Route',
          message: `${volunteerName || 'A volunteer'} has accepted your delivery and is heading to the store.`,
          subtitle: orderCode ? `Order #${orderCode} · Pickup in progress` : 'Pickup in progress',
        },
        picked_up: {
          emoji: '📍',
          title: 'Order Picked Up',
          message: `${volunteerName || 'Your volunteer'} has picked up your order and is on the way to you.`,
          subtitle: orderCode ? `Order #${orderCode} · Estimated delivery: within 30 min` : 'Estimated delivery: within 30 min',
        },
        completed: {
          emoji: '🌱',
          title: 'Order Delivered',
          message: 'Your order was successfully delivered. You helped rescue food from going to waste!',
          subtitle: orderCode ? `Order #${orderCode} · Thank you for making a difference` : 'Thank you for making a difference',
        },
        cancelled: {
          emoji: '✕',
          title: 'Order Cancelled',
          message: 'Your order has been cancelled. If you paid, a refund will be processed shortly.',
          subtitle: orderCode ? `Order #${orderCode} · Browse Marketplace for more options` : 'Browse Marketplace for more options',
        },
      };
      const entry = map[status || ''] || {
        emoji: '📋',
        title: 'Order Updated',
        message: `Your order${orderCode ? ` #${orderCode}` : ''} status changed to "${status || 'updated'}".`,
      };
      return { type, ...entry };
    }

    case 'task_update': {
      const taskMap: Record<string, { emoji: string; title: string; message: string; subtitle?: string }> = {
        accepted: {
          emoji: '🚗',
          title: 'Delivery Accepted',
          message: `Head to ${storeName || 'the store'} to pick up the packed order.`,
          subtitle: 'Bag is sealed and waiting for you',
        },
        picked_up: {
          emoji: '📦',
          title: 'Order Picked Up',
          message: 'Drop it off at the delivery address to complete the task.',
          subtitle: "You're almost done — great work!",
        },
        completed: {
          emoji: '🏆',
          title: 'Delivery Complete',
          message: 'You successfully completed a food rescue delivery.',
          subtitle: 'Every trip makes a real difference',
        },
        cancelled: {
          emoji: '✕',
          title: 'Task Cancelled',
          message: 'This pickup task has been cancelled by the store or customer.',
          subtitle: 'Check for other available pickups',
        },
        ready: {
          emoji: '🔔',
          title: 'Pickup Ready',
          message: `A food rescue bag is packed and waiting at ${storeName || 'a nearby store'}.`,
          subtitle: 'Accept the task to get started',
        },
      };
      const entry = taskMap[status || ''] || {
        emoji: '🚛',
        title: 'Task Updated',
        message: `Your delivery task has been updated to "${status}".`,
      };
      return { type, ...entry };
    }

    case 'system':
    default:
      return {
        type: 'system',
        emoji: '💚',
        title: 'EcoFeast',
        message: 'Welcome to the food rescue network.',
      };
  }
}
