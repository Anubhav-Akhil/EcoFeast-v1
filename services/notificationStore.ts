import { create } from 'zustand';

export type NotifType = 'new_item' | 'new_order' | 'task_update' | 'order_update' | 'system';

export interface NotificationItem {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  subtitle?: string;   // Secondary detail line
  emoji?: string;      // Lead emoji for the notification
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

export const useNotificationStore = create<NotificationState>((set) => ({
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
      ].slice(0, 50),
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
}));

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
        title: `Fresh drop from ${storeName || 'a local store'}`,
        message: itemTitle
          ? `${itemTitle} is now live — grab it before someone else does!`
          : 'New surplus items have just been listed near you.',
        subtitle: 'Tap to view in Marketplace',
      };

    case 'new_order':
      return {
        type,
        emoji: '🎉',
        title: 'New order just came in!',
        message: orderCode
          ? `Order #${orderCode} is waiting to be packed. Someone's counting on you.`
          : 'A new customer order has arrived for your store.',
        subtitle: 'Go to Orders to confirm',
      };

    case 'order_update': {
      const map: Record<string, { emoji: string; title: string; message: string; subtitle?: string }> = {
        received: {
          emoji: '📦',
          title: 'Your order is being prepared',
          message: `The team at ${storeName || 'the store'} is carefully packing your items right now.`,
          subtitle: 'Usually ready within the hour',
        },
        packed: {
          emoji: '✅',
          title: 'Packed and good to go!',
          message: 'Your bag is sealed and waiting for a volunteer to pick it up.',
          subtitle: 'A volunteer will be assigned shortly',
        },
        ready: {
          emoji: '🔔',
          title: 'Your order is ready for pickup!',
          message: `Your bag is at ${storeName || 'the store'} — a volunteer is heading over soon.`,
          subtitle: 'Stay close to your delivery address',
        },
        accepted: {
          emoji: '🚴',
          title: `${volunteerName || 'A volunteer'} is on their way!`,
          message: 'Your order has been accepted by a volunteer and will be delivered shortly.',
          subtitle: 'Real-time tracking coming soon',
        },
        picked_up: {
          emoji: '📍',
          title: 'Order picked up — en route!',
          message: `${volunteerName || 'Your volunteer'} has picked up your order and is heading to you now.`,
          subtitle: 'Estimated delivery: within 30 min',
        },
        completed: {
          emoji: '🌱',
          title: 'Delivered! You saved some food today.',
          message: 'Your order was successfully delivered. You helped rescue food from going to waste.',
          subtitle: 'Rate your experience in Orders',
        },
        cancelled: {
          emoji: '❌',
          title: 'Order was cancelled',
          message: 'Your order has been cancelled. If you paid, a refund will be processed shortly.',
          subtitle: 'Browse Marketplace for more options',
        },
      };
      const entry = map[status || ''] || {
        emoji: '📋',
        title: 'Order status updated',
        message: `Your order is now marked as "${status || 'updated'}".`,
      };
      return { type, ...entry };
    }

    case 'task_update': {
      const taskMap: Record<string, { emoji: string; title: string; message: string }> = {
        accepted: {
          emoji: '🚗',
          title: 'You've accepted a delivery task',
          message: `Head to ${storeName || 'the store'} to pick up the order. Bag is packed and ready.`,
        },
        picked_up: {
          emoji: '📦',
          title: 'Picked up! Now deliver it.',
          message: 'The order is in your hands. Drop it off at the customer\'s address to complete the task.',
        },
        completed: {
          emoji: '🏆',
          title: 'Task complete — great work!',
          message: 'You successfully completed a food rescue delivery. Every trip makes a difference.',
        },
        cancelled: {
          emoji: '⚠️',
          title: 'Delivery task cancelled',
          message: 'This pickup task has been cancelled by the store or customer.',
        },
      };
      const entry = taskMap[status || ''] || {
        emoji: '🚛',
        title: `Task updated to ${status || 'new status'}`,
        message: `Your delivery task status has changed to "${status}".`,
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
