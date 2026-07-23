import { ChatGroq } from "@langchain/groq";

const llm = new ChatGroq({
  model: "llama-3.1-8b-instant",
  apiKey: process.env.GROQ_API_KEY,
  maxRetries: 3,
  temperature: 0.3, // Slightly higher temp for more natural conversational tone
});

/**
 * ResponseNode
 * 
 * Generates the natural-language response that will be streamed to the student.
 * If needsFollowUp is true, it generates the next question.
 * If triageComplete is true, it generates the closing acknowledgment.
 */
export async function responseNode(state) {
  const { conversationHistory, retrievedCitations, triageComplete, needsFollowUp, riskScore } = state;

  const historyText = conversationHistory
    .map(msg => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const contextText = retrievedCitations.map(c => `[${c.section}]: ${c.text}`).join("\n");

  let prompt = "";

  if (triageComplete) {
    prompt = `
You are a campus triage assistant. The triage process is now complete.
Generate a brief, polite closing message to the student.
Acknowledge their symptoms, tell them the information has been sent to the doctor, and advise them to select a doctor and time slot below.
If the Risk Score is "Critical", advise them to head to the dispensary immediately or call campus security.

Risk Score: ${riskScore}
Conversation History:
${historyText}

Closing message (natural language, 1-2 sentences):
`;
  } else if (needsFollowUp) {
    prompt = `
You are a campus triage assistant. You need to ask a follow-up question to clarify the student's symptoms.
Review the conversation and the medical guidelines.
Ask ONE clear, empathetic follow-up question. 
If relevant, ask about specific red flags mentioned in the guidelines to rule out emergencies.
Do NOT diagnose the student. Keep it conversational.

Medical Guidelines:
${contextText}

Conversation History:
${historyText}

Follow-up question (natural language, 1-2 sentences):
`;
  } else {
    // Fallback
    return { responseText: "Thank you. Your information has been recorded." };
  }

  try {
    const response = await llm.invoke(prompt);
    return { responseText: response.content.trim() };
  } catch (error) {
    console.error("[ResponseNode] Error:", error.message);
    if (triageComplete) {
      return { responseText: "Your triage is complete. Please select a doctor below." };
    }
    return { responseText: "Can you tell me a bit more about how you're feeling?" };
  }
}
