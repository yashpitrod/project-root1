import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL || "gemini-3-flash",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 5,
  temperature: 0,
});

/**
 * RiskScoreNode
 * 
 * Uses the retrieved medical citations and the extracted symptoms to assign
 * an urgency score (Low, Medium, High, Critical).
 */
export async function riskScoreNode(state) {
  const { extractedSymptoms, retrievedCitations } = state;

  if (!extractedSymptoms || extractedSymptoms.length === 0) {
    return { riskScore: "Low" };
  }

  // Format citations for context
  const contextText = retrievedCitations
    .map(c => `[${c.section}]: ${c.text}`)
    .join("\n\n");

  const symptomsText = extractedSymptoms.join(", ");

  const prompt = `
You are a medical triage assistant at a university health clinic.
Your task is to assign a risk score to the student's symptoms based ONLY on the provided medical guidelines.

Student Symptoms: ${symptomsText}

Medical Guidelines / Context:
${contextText || "No specific guidelines retrieved. Use general clinical judgement."}

Risk Scoring Tiers:
- Low: Minor symptoms, standard cold, mild pain. Self-care or routine OPD visit is sufficient.
- Medium: Moderate symptoms needing evaluation within a day, e.g., minor injuries, moderate pain without red flags.
- High: Severe symptoms needing prompt attention, e.g., high fever, severe pain, possible fracture.
- Critical: Life-threatening or medical emergency, e.g., anaphylaxis, thunderclap headache, breathing difficulty, non-blanching rash.

Based on the Red Flags and Escalation criteria in the guidelines, classify the urgency.
Respond with EXACTLY ONE WORD: "Low", "Medium", "High", or "Critical".
`;

  try {
    const response = await llm.invoke(prompt);
    let score = response.content.trim().replace(/[^a-zA-Z]/g, ""); // Remove any punctuation

    // Normalize to standard casing
    if (score.toLowerCase() === "critical") score = "Critical";
    else if (score.toLowerCase() === "high") score = "High";
    else if (score.toLowerCase() === "medium") score = "Medium";
    else score = "Low"; // Fallback to Low if unrecognized

    return { riskScore: score };
  } catch (error) {
    console.error("[RiskScoreNode] Error:", error.message);
    // Safe fallback
    return { riskScore: "Low" };
  }
}
