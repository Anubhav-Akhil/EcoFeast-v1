import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: 'new_item' | 'order_update' | 'system';
  title: string;
  message: string;
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
      ].slice(0, 50), // Keep last 50 notifications
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
