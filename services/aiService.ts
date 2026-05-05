const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export const predictExpiryAndTags = async (
  itemName: string,
  category: string
): Promise<{ expiryHours: number; tags: string[]; impactCO2: number }> => {
  try {
    const response = await fetch(`${API_BASE}/ai/predict-expiry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemName, category }),
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    return {
      expiryHours: Number(data.expiryHours || 24),
      tags: Array.isArray(data.tags) ? data.tags : ["Fresh", "Rescued", "Tasty"],
      impactCO2: Number(data.impactCO2 || 0.5),
    };
  } catch {
    return {
      expiryHours: 24,
      tags: ["Fresh", "Rescued", "Tasty"],
      impactCO2: 0.5,
    };
  }
};

export const suggestRecipe = async (items: string[]): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/ai/suggest-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) throw new Error("AI request failed");
    const data = await response.json();
    return data.text || "Mix them together for a surprise stew!";
  } catch {
    return "Delicious Eco-Salad";
  }
};

