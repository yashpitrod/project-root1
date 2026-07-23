import ChatSession from "../models/ChatSession.js";
import { triageGraph } from "../agents/triageGraph.js";
import { classifyIntent } from "../agents/intentClassifier.js";
import { searchCampus } from "../services/vectorStore.js"; // For FAQ
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  model: process.env.GEMINI_CHAT_MODEL || "gemini-3-flash",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 5,
  temperature: 0.3,
});

// ERR-01: Error classification for recoverable vs fatal errors.
// Transient errors (Gemini timeout, rate limit, network) get recoverable: true.
// Fatal errors (missing session, auth, data corruption) get recoverable: false.
function classifyError(error) {
  const msg = error?.message?.toLowerCase() || "";
  const status = error?.status || error?.response?.status;

  // Gemini / Google API transient errors
  if (status === 429 || status === 503 || status === 500) {
    return { recoverable: true, userMessage: "The AI service is temporarily busy. Please try sending your message again in a moment." };
  }
  if (msg.includes("timeout") || msg.includes("econnreset") || msg.includes("enotfound") || msg.includes("socket hang up")) {
    return { recoverable: true, userMessage: "A network issue occurred. Please try again." };
  }
  if (msg.includes("rate limit") || msg.includes("quota") || msg.includes("resource_exhausted")) {
    return { recoverable: true, userMessage: "The AI service hit a rate limit. Please wait a moment and try again." };
  }

  // Fatal / unrecoverable errors
  if (msg.includes("api key") || msg.includes("permission") || msg.includes("authentication") || msg.includes("unauthorized")) {
    return { recoverable: false, userMessage: "A service configuration error occurred. Please contact support." };
  }
  if (msg.includes("session") || msg.includes("not found") || msg.includes("cast to objectid")) {
    return { recoverable: false, userMessage: "Your session could not be found. Please start a new conversation." };
  }
  if (msg.includes("validation") || msg.includes("schema") || msg.includes("invalid")) {
    return { recoverable: false, userMessage: "An unexpected data error occurred. Please start a new conversation." };
  }

  // Default: assume transient
  return { recoverable: true, userMessage: "I'm having trouble processing that right now. Please try again." };
}

/**
 * Handles incoming chat messages over Socket.IO.
 * 
 * Flow:
 * 1. Fetch or create ChatSession in MongoDB.
 * 2. On first message, use Intent Classifier (triage vs faq).
 * 3. Route to either LangGraph (triage) or simple RAG (faq).
 * 4. Stream real LLM tokens back to client via chat-response events.
 * 5. Save updated state back to MongoDB.
 * 6. If triageComplete is true, emit triage-complete to frontend.
 */
export function registerChatHandlers(io, socket) {

  socket.on("chat-message", async (data, ack) => {
    try {
      // Validate input
      const { sessionId, userId, text } = data;
      if (!sessionId || !userId || !text) {
        if (typeof ack === "function") ack({ status: "error", message: "Missing required fields" });
        return;
      }

      // Acknowledge receipt quickly (<200ms requirement)
      if (typeof ack === "function") ack({ status: "received" });

      // 1. Fetch or Initialize Session
      let session = await ChatSession.findOne({ sessionId });
      if (!session) {
        session = new ChatSession({
          sessionId,
          userId,
          mode: "unknown",
          state: {
            conversationHistory: [],
            extractedSymptoms: [],
            retrievedCitations: [],
            riskScore: null,
            triageComplete: false,
            needsFollowUp: false,
            responseText: null,
            finalSummary: null
          }
        });
      }

      // 2. Classify Intent on first message
      if (session.mode === "unknown" && session.state.conversationHistory.length === 0) {
        session.mode = await classifyIntent(text);
      }

      // Add user message to history
      const userMessage = { role: "user", content: text };
      session.state.conversationHistory.push(userMessage);

      // Notify client that assistant is typing
      socket.emit("chat-typing", { sessionId });

      let responseText = "";

      // 3. Route based on mode
      if (session.mode === "triage") {
        // --- TRIAGE MODE (LangGraph) ---
        const finalState = await triageGraph.invoke(session.state);

        // ISSUE-3 VERIFICATION:
        // finalState contains ALL graph output including:
        //   - .conversationHistory (from extractionNode input + all turns)
        //   - .retrievedCitations (from retrievalNode — the RAG grounding data)
        //   - .extractedSymptoms (from extractionNode)
        //   - .riskScore (from riskScoreNode)
        //   - .triageComplete / .needsFollowUp (from routingNode)
        //
        // These are passed into the prompt construction below, matching
        // exactly what the removed responseNode used to receive at line 18:
        //   const { conversationHistory, retrievedCitations, triageComplete, needsFollowUp, riskScore } = state;

        const historyText = finalState.conversationHistory
          .map(msg => `${msg.role === "user" ? "Student" : "Assistant"}: ${msg.content}`)
          .join("\n");
        // RAG grounding: retrievedCitations from the graph's retrievalNode
        const contextText = finalState.retrievedCitations.map(c => `[${c.section}]: ${c.text}`).join("\n");
        // Extracted symptoms for context
        const symptomsText = finalState.extractedSymptoms.join(", ");

        let prompt = "";
        if (finalState.triageComplete) {
          prompt = `You are a campus triage assistant. The triage process is now complete.
Generate a brief, polite closing message to the student.
Acknowledge their symptoms, tell them the information has been sent to the doctor, and advise them to select a doctor and time slot below.
If the Risk Score is "Critical", advise them to head to the dispensary immediately or call campus security.

Extracted Symptoms: ${symptomsText}
Risk Score: ${finalState.riskScore}

Medical Context (from knowledge base):
${contextText}

Conversation History:
${historyText}

Closing message (natural language, 1-2 sentences):`;
        } else if (finalState.needsFollowUp) {
          prompt = `You are a campus triage assistant. You need to ask a follow-up question to clarify the student's symptoms.
Review the conversation and the medical guidelines.
Ask ONE clear, empathetic follow-up question. 
If relevant, ask about specific red flags mentioned in the guidelines to rule out emergencies.
Do NOT diagnose the student. Keep it conversational.

Extracted Symptoms So Far: ${symptomsText}

Medical Guidelines (from knowledge base):
${contextText}

Conversation History:
${historyText}

Follow-up question (natural language, 1-2 sentences):`;
        } else {
          prompt = `Say: "Thank you. Your information has been recorded."`;
        }

        // True LLM Streaming
        const stream = await llm.stream(prompt);
        for await (const chunk of stream) {
          const token = chunk.content;
          responseText += token;
          socket.emit("chat-response", { token, done: false });
        }
        socket.emit("chat-response", { token: "", done: true });

        // Update session state
        finalState.responseText = responseText;
        session.state = finalState;
        session.state.conversationHistory.push({ role: "assistant", content: responseText });

        // If complete, send sessionId to frontend for the createRequest call
        if (finalState.triageComplete) {
          socket.emit("triage-complete", {
            sessionId,
            summary: finalState.finalSummary,
            symptoms: finalState.extractedSymptoms,
            riskScore: finalState.riskScore,
          });
        }

      } else {
        // --- FAQ MODE (Campus RAG) ---
        const results = await searchCampus(text, 2);

        let prompt = "";
        if (results.length > 0) {
          const context = results.map(r => `[${r.metadata.section}]: ${r.text}`).join("\n\n");
          // ISSUE-4 FIX: Explicit grounding constraint — answer ONLY from provided KB,
          // never from general knowledge. Decline if the answer isn't in the provided context.
          prompt = `You are a campus health center assistant answering a student's question about campus health policies.

CRITICAL RULES:
- You MUST answer ONLY using the information provided in the "Campus Policies" section below.
- If the student's question cannot be answered from the provided policies, say: "I don't have specific information about that in our campus policies. You might want to check with the dispensary front desk directly."
- Do NOT fill gaps with general knowledge, assumptions, or information not present in the provided policies.
- Keep your answer polite, concise, and helpful.

Campus Policies:
${context}

Student Question: ${text}

Answer (based ONLY on the policies above):`;
        } else {
          // No KB results found — decline without invoking LLM to avoid hallucination
          responseText = "I don't have specific information about that in our campus policies. You might want to check with the dispensary front desk directly, or try rephrasing your question.";

          // Stream the static response for UI consistency
          const words = responseText.split(" ");
          for (const word of words) {
            socket.emit("chat-response", { token: word + " ", done: false });
          }
          socket.emit("chat-response", { token: "", done: true });
          session.state.conversationHistory.push({ role: "assistant", content: responseText });

          // Save and return early
          session.markModified('state');
          await session.save();
          return;
        }

        // True LLM Streaming (only when KB results were found)
        const stream = await llm.stream(prompt);
        for await (const chunk of stream) {
          const token = chunk.content;
          responseText += token;
          socket.emit("chat-response", { token, done: false });
        }
        socket.emit("chat-response", { token: "", done: true });

        // Add assistant response to history
        session.state.conversationHistory.push({ role: "assistant", content: responseText });
      }

      // 5. Save updated session
      session.markModified('state');
      await session.save();

    } catch (error) {
      console.error("[ChatSocket] Error:", error);
      // ERR-01: Classify the error to determine if it's recoverable
      const classified = classifyError(error);
      socket.emit("chat-error", {
        message: classified.userMessage,
        recoverable: classified.recoverable
      });
    }
  });
}
