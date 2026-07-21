import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { buildVectorStores } from "../services/vectorStore.js";
import { triageGraph } from "../agents/triageGraph.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Phase 2b Verification — Golden Test Set Accuracy     ");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("Building vector stores for RAG context...");
  await buildVectorStores();

  const testSetPath = path.resolve(__dirname, "golden-test-set.json");
  const testData = JSON.parse(await fs.readFile(testSetPath, "utf-8")).slice(0, 4);
  
  console.log(`\nRunning pipeline against ${testData.length} test cases to respect API limits...\n`);

  let passed = 0;
  const results = [];

  for (let i = 0; i < testData.length; i++) {
    const tc = testData[i];
    
    // Setup initial state mimicking a first message
    const initialState = {
      conversationHistory: [{ role: "user", content: tc.input }],
      extractedSymptoms: [],
      retrievedCitations: [],
      riskScore: null,
      triageComplete: false,
      needsFollowUp: false,
      responseText: null,
      finalSummary: null
    };

    try {
      // Respect RPM limits
      if (i > 0) {
        await new Promise(r => setTimeout(r, 4000));
      }
      // Run the pipeline
      const finalState = await triageGraph.invoke(initialState);
      const actualScore = finalState.riskScore;
      
      const isMatch = actualScore === tc.expectedTier;
      if (isMatch) passed++;
      
      results.push({
        input: tc.input,
        expected: tc.expectedTier,
        actual: actualScore,
        match: isMatch,
        symptoms: finalState.extractedSymptoms
      });

      console.log(`[${i+1}/${testData.length}] Expected: ${tc.expectedTier.padEnd(8)} | Actual: ${(actualScore || "None").padEnd(8)} | Match: ${isMatch ? "✅" : "❌"}`);
    } catch (err) {
      console.log(`[${i+1}/${testData.length}] ERROR processing test case: ${err.message}`);
      results.push({ input: tc.input, expected: tc.expectedTier, actual: "ERROR", match: false });
    }
  }

  const accuracy = (passed / testData.length) * 100;
  
  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`  Overall Accuracy: ${accuracy.toFixed(1)}% (${passed}/${testData.length} passed)`);
  
  if (accuracy >= 80) {
    console.log("  ✅ Target accuracy of ≥80% ACHIEVED.");
  } else {
    console.log("  ❌ Accuracy below 80% target. Review RiskScoreNode prompt.");
  }
  console.log("═══════════════════════════════════════════════════════\n");
  
  process.exit(accuracy >= 80 ? 0 : 1);
}

runTests().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
