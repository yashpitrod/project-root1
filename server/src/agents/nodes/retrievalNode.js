import { searchMedical } from "../../services/vectorStore.js";

/**
 * RetrievalNode
 * 
 * Takes the extracted symptoms and queries the medical vector store to retrieve
 * relevant medical context (red flags, escalation criteria, etc.).
 */
export async function retrievalNode(state) {
  const { extractedSymptoms } = state;
  
  if (!extractedSymptoms || extractedSymptoms.length === 0) {
    return { retrievedCitations: [] };
  }
  
  // Combine symptoms into a single query string for semantic search
  const query = extractedSymptoms.join(" ");
  
  try {
    // Retrieve top 3 relevant chunks from the medical KB
    const results = await searchMedical(query, 3);
    
    // Format the results into citations
    const citations = results.map(result => ({
      source: result.metadata.source,
      section: result.metadata.section,
      text: result.text,
      score: result.score
    }));
    
    return { retrievedCitations: citations };
  } catch (error) {
    console.error("[RetrievalNode] Error:", error.message);
    return { retrievedCitations: [] };
  }
}
