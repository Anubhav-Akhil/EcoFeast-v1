import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const predictExpiryAndTags = async (itemName: string, category: string): Promise<{ expiryHours: number; tags: string[]; impactCO2: number }> => {
  try {
    const prompt = `
      Analyze the food item "${itemName}" in category "${category}".
      Return a JSON object with:
      1. "expiryHours": estimated hours until it spoils if left at room temp (conservative estimate).
      2. "tags": Array of 3 short marketing tags (e.g., "Vegan", "Sweet").
      3. "impactCO2": estimated kg of CO2 prevented by rescuing 1kg of this food.
      Output ONLY valid JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    // Fallback if API fails or key missing
    return {
      expiryHours: 24,
      tags: ["Fresh", "Rescued", "Tasty"],
      impactCO2: 0.5
    };
  }
};

export const suggestRecipe = async (items: string[]): Promise<string> => {
    try {
        const prompt = `Suggest a simple recipe name and 1-sentence description using these leftover ingredients: ${items.join(', ')}.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Mix them together for a surprise stew!";
    } catch (e) {
        return "Delicious Eco-Salad";
    }
}