import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL || "gemini-3-flash",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 5,
  temperature: 0,
});

/**
 * ExtractionNode
 * 
 * Analyzes the conversation history to extract a structured list of current symptoms.
 * This structured list is used for semantic retrieval and final summary.
 */
export async function extractionNode(state) {
  const { conversationHistory, extractedSymptoms } = state;

  // Format history for the prompt
  const historyText = conversationHistory
    .map(msg => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const prompt = `
You are a medical data extraction assistant for a campus triage system.
Review the following conversation between a student and a triage assistant.
Extract a concise list of the student's current symptoms and relevant medical details (e.g., duration, severity, specific locations).

Previously extracted symptoms: ${JSON.stringify(extractedSymptoms)}

Conversation:
${historyText}

Instructions:
- Return ONLY a JSON array of strings, where each string is a distinct symptom or detail.
- Do NOT include markdown formatting (like \`\`\`json) in your response, just the raw JSON array.
- If there are no medical symptoms mentioned, return an empty array: []

Example output:
["High fever (102F)", "Stiff neck", "Headache for 2 days"]
`;

  try {
    const response = await llm.invoke(prompt);
    let content = response.content.trim();

    // Clean up potential markdown formatting from the LLM
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    }

    const newSymptoms = JSON.parse(content);

    if (Array.isArray(newSymptoms)) {
      return { extractedSymptoms: newSymptoms };
    }
    return { extractedSymptoms: [] };
  } catch (error) {
    console.error("[ExtractionNode] Error:", error.message);
    // On error, return existing symptoms to avoid pipeline crash
    return { extractedSymptoms: state.extractedSymptoms || [] };
  }
}
