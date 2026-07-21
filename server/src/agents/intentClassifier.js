import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Initialize Gemini flash for fast intent classification
const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL || "gemini-2.1",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 5,
  temperature: 0,
});

/**
 * Classifies the initial user message to determine if it's a medical triage or a campus FAQ.
 * Runs only ONCE per session.
 * 
 * @param {string} initialMessage - The first message from the student
 * @returns {Promise<"triage" | "faq" | "unknown">}
 */
export async function classifyIntent(initialMessage) {
  const prompt = `
You are a routing agent for a university campus health center.
Your job is to classify the student's message into one of two categories:

1. "triage" - The student is describing physical or mental symptoms, feeling unwell, or asking for medical help/advice about a condition (e.g. "I have a fever", "My stomach hurts", "I twisted my ankle").
2. "faq" - The student is asking about campus dispensary policies, timings, doctor availability, insurance, or rescheduling an appointment (e.g. "Is the dispensary open?", "How do I cancel my booking?").

Respond with EXACTLY ONE WORD: either "triage" or "faq". Do not include any other text, punctuation, or explanation.

Message: "${initialMessage}"
Classification:`;

  try {
    const response = await llm.invoke(prompt);
    const result = response.content.trim().toLowerCase();

    if (result.includes("triage")) return "triage";
    if (result.includes("faq")) return "faq";

    // Fallback if the model returns something weird
    return "triage";
  } catch (error) {
    console.error("[IntentClassifier] Error:", error.message);
    // Safe fallback to triage if API fails
    return "triage";
  }
}
