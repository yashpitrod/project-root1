import { GoogleGenAI } from "@google/genai";

// GM-04: Guard against missing API key at startup
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

// Single Gemini client instance for the entire server
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Translate text to English using Gemini.
 * @param {string} text - The text to translate.
 * @returns {Promise<string>} The translated English text.
 */
export const translateToEnglish = async (text) => {
  try {
    const response = await Promise.race([
      client.models.generateContent({
        model: process.env.GEMINI_CHAT_MODEL || "gemini-2.0-flash",
        contents: [{
          role: "user",
          parts: [{
            text: `Translate the following text into English. Return ONLY the translated English text.\n\nText:\n${text}`,
          }],
        }],
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      )
    ]);

    // GM-01: response.text is a getter that can return undefined — guard against it
    const translated = response.text;
    if (!translated) {
      throw new Error("Gemini returned empty response");
    }
    return translated.trim();
  } catch (error) {
    console.error("Gemini translation error:", error.status, error.message);
    throw new Error("Translation failed");
  }
};

export default client;