import { GoogleGenAI } from "@google/genai"; // The new 2025 library
import 'dotenv/config'; 

// Initialize the Client (no more new GoogleGenerativeAI)
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export const translateToEnglishGemini = async (text) => {
  try {
    // UPDATED: Using the exact string from your 'curl' result
    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{
        role: "user",
        parts: [{ text: `Translate the following to English. Return ONLY the translation: ${text}` }]
      }]
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error.status, error.message);
    throw new Error("Translation failed");
  }
};