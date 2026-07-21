import { Annotation } from "@langchain/langgraph";

/**
 * Defines the state schema for the triage LangGraph pipeline.
 * Using LangGraph's Annotation wrapper to define how state updates are merged.
 */
export const TriageGraphState = Annotation.Root({
  // Unique session identifier for MongoDB persistence
  sessionId: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => null,
  }),
  
  // Mode will be determined once by the intent classifier ("triage" or "faq")
  mode: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => "unknown",
  }),

  // The chat history so far. Update appends to the array.
  conversationHistory: Annotation({
    reducer: (state, update) => state.concat(update),
    default: () => [],
  }),

  // Extracted symptoms (e.g. ["high fever", "stiff neck"])
  extractedSymptoms: Annotation({
    reducer: (state, update) => (update ? [...new Set([...state, ...update])] : state),
    default: () => [],
  }),

  // Citations retrieved from the vector store for grounding
  retrievedCitations: Annotation({
    reducer: (state, update) => update ?? state, // Overwrite on each retrieval pass
    default: () => [],
  }),

  // Assigned risk score ("Low", "Medium", "High", "Critical")
  riskScore: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => null,
  }),

  // Boolean flag indicating if we have enough info to route to doctor
  triageComplete: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => false,
  }),

  // Boolean flag indicating if we need to ask a follow-up question
  needsFollowUp: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => false,
  }),

  // The latest natural-language response generated to show to the student
  responseText: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => null,
  }),

  // The final structured summary for the doctor dashboard
  finalSummary: Annotation({
    reducer: (state, update) => update ?? state,
    default: () => null,
  }),
});
