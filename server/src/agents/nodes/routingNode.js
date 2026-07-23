import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const primaryModel = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL || "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 3,
  temperature: 0,
});
const fallbackModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash-8b",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 3,
  temperature: 0,
});
const llm = primaryModel.withFallbacks({ fallbacks: [fallbackModel] });

/**
 * RoutingNode
 * 
 * Analyzes the state to decide if triage is complete or if follow-up questions are needed.
 * If complete, it generates the final structured summary for the doctor.
 * DOES NOT generate user-facing text.
 */
export async function routingNode(state) {
  const { conversationHistory, extractedSymptoms, retrievedCitations, riskScore } = state;

  // Quick heuristic: If we don't have basic symptoms yet, we definitely need follow-up
  if (!extractedSymptoms || extractedSymptoms.length === 0) {
    return { triageComplete: false, needsFollowUp: true };
  }

  // Count user turns to prevent infinite loops (max 4 questions)
  const userTurns = conversationHistory.filter(msg => msg.role === "user").length;
  if (userTurns >= 4) {
    return await finalizeTriage(state);
  }

  // Use LLM to decide if we have enough info based on medical context
  const contextText = retrievedCitations.map(c => `[${c.section}]: ${c.text}`).join("\n");
  const historyText = conversationHistory
    .map(msg => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const prompt = `
You are evaluating a student's medical triage intake.
Your goal is to decide if you have enough information to hand off to a doctor, or if you must ask a follow-up question.

Current Symptoms: ${JSON.stringify(extractedSymptoms)}
Current Risk Score: ${riskScore}

Medical Context (Look for specific Red Flags we might need to rule out):
${contextText}

Conversation History:
${historyText}

Rules:
1. We need basic information: What is the main symptom? How long has it been happening? How severe is it?
2. Are there any critical red flags in the Medical Context that we should explicitly ask about to rule out emergencies?
3. Do not ask more than 3-4 questions total. Keep it brief.

Respond in JSON format:
{
  "complete": boolean (true if enough info gathered, false if follow-up needed)
}
Do not include markdown tags, just raw JSON.
`;

  try {
    const response = await llm.invoke(prompt);
    let content = response.content.trim();
    if (content.startsWith("```json")) content = content.replace(/^```json\n/, "").replace(/\n```$/, "");

    const decision = JSON.parse(content);

    if (decision.complete) {
      return await finalizeTriage(state);
    } else {
      return { triageComplete: false, needsFollowUp: true };
    }
  } catch (error) {
    console.error("[RoutingNode] Error:", error.message);
    // On error, just complete triage to avoid getting stuck
    return await finalizeTriage(state);
  }
}

async function finalizeTriage(state) {
  // Generate the final summary for the doctor dashboard
  const { conversationHistory, extractedSymptoms, riskScore } = state;

  const historyText = conversationHistory
    .map(msg => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
    .join("\n");

  const prompt = `
Summarize the following triage conversation for a doctor.
Be concise and clinical.

Symptoms List: ${JSON.stringify(extractedSymptoms)}
Assigned Risk Score: ${riskScore}

Conversation:
${historyText}

Provide a 2-3 sentence clinical summary.
`;

  try {
    const response = await llm.invoke(prompt);
    const summary = response.content.trim();

    return {
      triageComplete: true,
      needsFollowUp: false,
      finalSummary: summary
    };
  } catch (error) {
    console.error("[RoutingNode] Summary Error:", error.message);
    return {
      triageComplete: true,
      needsFollowUp: false,
      finalSummary: `Patient reports: ${extractedSymptoms.join(", ")}`
    };
  }
}
