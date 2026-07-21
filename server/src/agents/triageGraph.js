import { StateGraph, START, END } from "@langchain/langgraph";
import { TriageGraphState } from "./graphState.js";
import { extractionNode } from "./nodes/extractionNode.js";
import { retrievalNode } from "./nodes/retrievalNode.js";
import { riskScoreNode } from "./nodes/riskScoreNode.js";
import { routingNode } from "./nodes/routingNode.js";

/**
 * Builds the LangGraph state machine for medical triage.
 * 
 * Flow:
 * START 
 *  -> extraction (extract symptoms)
 *  -> retrieval (grounding against KB)
 *  -> riskScore (assign Low/Med/High/Critical)
 *  -> routing (decide if we need follow-up or complete)
 *  -> END
 *  -> END
 */
export function buildTriageGraph() {
  const workflow = new StateGraph(TriageGraphState)
    .addNode("extraction", extractionNode)
    .addNode("retrieval", retrievalNode)
    .addNode("riskScoring", riskScoreNode)
    .addNode("routing", routingNode)

    // Define the linear flow
    .addEdge(START, "extraction")
    .addEdge("extraction", "retrieval")
    .addEdge("retrieval", "riskScoring")
    .addEdge("riskScoring", "routing")
    .addEdge("routing", END);

  return workflow.compile();
}

// Export a compiled instance for direct usage
export const triageGraph = buildTriageGraph();
