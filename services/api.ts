import { Charity, Item, Reservation, Task, User, UserRole } from "../types";

const STORAGE_KEYS = {
  TOKEN: "ecofeast_token",
  SESSION: "ecofeast_session",
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const headers = new Headers(init.headers || {});

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (withAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const payload = await parseJsonSafe(response);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }

  return payload as T;
}

function persistSession(user: User, token: string) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export const api = {
  login: async (
    email: string,
    role: UserRole,
    details: any,
    mode: "login" | "signup" = "login"
  ): Promise<User> => {
    const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
    const body =
      mode === "signup"
        ? {
            email,
            password: details?.password,
            role,
            name: details?.name,
            orgName: details?.orgName,
            phone: details?.phone,
            address: details?.address,
            vehicleType: details?.vehicleType,
          }
        : {
            email,
            password: details?.password,
          };

    const result = await request<{ user: User; token: string }>(
      endpoint,
      { method: "POST", body: JSON.stringify(body) },
      false
    );
    persistSession(result.user, result.token);
    return result.user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getSession: (): User | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  },

  refreshSession: async (): Promise<User | null> => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) return null;
    try {
      const result = await request<{ user: User }>("/auth/me");
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(result.user));
      return result.user;
    } catch {
      api.logout();
      return null;
    }
  },

  getItems: async (): Promise<Item[]> => {
    return request<Item[]>("/items", { method: "GET" }, false);
  },

  addItem: async (item: Omit<Item, "id" | "status">): Promise<Item> => {
    return request<Item>("/items", {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  deleteItem: async (itemId: string): Promise<void> => {
    await request(`/items/${itemId}`, { method: "DELETE" });
  },

  updateItem: async (itemId: string, patch: Partial<Item> & { quantityDelta?: number }): Promise<Item> => {
    return request<Item>(`/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  createOrder: async (_userId: string, itemsToOrder: Item[]): Promise<Reservation> => {
    return request<Reservation>("/orders", {
      method: "POST",
      body: JSON.stringify({ items: itemsToOrder.map((item) => ({ id: item.id })) }),
    });
  },

  getUserReservations: async (_userId: string): Promise<Reservation[]> => {
    return request<Reservation[]>("/orders/my");
  },

  getCharities: async (): Promise<Charity[]> => {
    return request<Charity[]>("/charities", { method: "GET" }, false);
  },

  getTasks: async (): Promise<Task[]> => {
    return request<Task[]>("/tasks");
  },

  updateTaskStatus: async (taskId: string, status: Task["status"]): Promise<void> => {
    await request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  sendContactMessage: async (name: string, email: string, message: string): Promise<void> => {
    await request(
      "/contact",
      {
        method: "POST",
        body: JSON.stringify({ name, email, message }),
      },
      false
    );
  },
};
