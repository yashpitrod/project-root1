import { ChatGroq } from "@langchain/groq";

// GM-04: Guard against missing API key at startup
if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY environment variable is not set");
}

const llm = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  maxRetries: 3,
});

/**
 * Translate text to English using Gemini.
 * @param {string} text - The text to translate.
 * @returns {Promise<string>} The translated English text.
 */
export const translateToEnglish = async (text) => {
  try {
    const response = await Promise.race([
      llm.invoke(`Translate the following text into English. Return ONLY the translated English text.\n\nText:\n${text}`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000)
      )
    ]);

    const translated = response?.content;
    if (!translated) {
      throw new Error("Groq returned empty response");
    }
    return translated.trim();
  } catch (error) {
    console.error("Groq translation error:", error.status, error.message);
    throw new Error("Translation failed");
  }
};
