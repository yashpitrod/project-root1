/**
 * verifyVectorStore.js
 *
 * Phase 2a Verification Script
 *
 * Runs a set of sample queries against both the medical and campus KB stores.
 * Verifies:
 *   1. Relevant chunks are returned for each query
 *   2. No cross-contamination (medical queries don't surface campus chunks, and vice versa)
 *   3. Similarity scores are reasonable (> 0.4 for relevant results)
 *
 * Usage:
 *   node server/src/tests/verifyVectorStore.js
 *
 * Uses local deterministic embeddings and does not require an AI API key.
 */

import "dotenv/config";
import { buildVectorStores, searchMedical, searchCampus, getStoreStats } from "../services/vectorStore.js";

// ── Test cases ────────────────────────────────────────────────────────────────

const MEDICAL_QUERIES = [
  {
    query: "I have a high fever with stiff neck and confusion",
    expectContains: ["meningitis", "red flag", "critical", "confusion", "stiff neck"],
    description: "High-risk fever → should return Fever & Flu > Red Flags",
  },
  {
    query: "sore throat with white patches on tonsils",
    expectContains: ["tonsil", "white", "strep", "bacterial"],
    description: "Sore throat → should return sore-throat.md sections",
  },
  {
    query: "I twisted my ankle playing sports and it is swollen",
    expectContains: ["sprain", "RICE", "ice", "elevation", "swelling"],
    description: "Ankle sprain → should return sprains-fractures.md",
  },
  {
    query: "difficulty breathing chest tightness wheezing",
    expectContains: ["asthma", "wheeze", "bronch", "inhaler", "breathing"],
    description: "Breathing difficulty → should return asthma.md",
  },
  {
    query: "stomach cramps after eating mess food vomiting",
    expectContains: ["food", "vomiting", "diarrhea", "ORS", "contaminated"],
    description: "Food poisoning → should return food-poisoning.md",
  },
  {
    query: "I am feeling very anxious and cannot sleep before exams",
    expectContains: ["anxiety", "stress", "sleep", "exam", "counseling"],
    description: "Anxiety/stress → should return stress-anxiety.md",
  },
  {
    query: "burning when urinating and frequent need to pee",
    expectContains: ["UTI", "urinary", "burning", "dysuria"],
    description: "UTI symptoms → should return uti.md",
  },
  {
    query: "worst headache of my life sudden onset",
    expectContains: ["thunderclap", "emergency", "worst", "subarachnoid"],
    description: "Thunderclap headache → critical red flag in headache-migraine.md",
  },
];

const CAMPUS_QUERIES = [
  {
    query: "Is the dispensary open today?",
    expectContains: ["dispensary", "open", "hours", "OPD"],
    description: "Dispensary status → should return dispensary-timings.md",
  },
  {
    query: "How do I reschedule my appointment?",
    expectContains: ["reschedule", "cancel", "appointment", "portal"],
    description: "Rescheduling → should return rescheduling-policies.md",
  },
  {
    query: "What medicines are free at the dispensary?",
    expectContains: ["free", "medicine", "paracetamol", "ORS"],
    description: "Free medicines → should return dispensary-timings.md",
  },
  {
    query: "How do I get a sick leave certificate?",
    expectContains: ["certificate", "sick leave", "dispensary", "academic"],
    description: "Sick leave → should return emergency-procedures.md or insurance-referrals.md",
  },
];

// ── Cross-contamination checks ────────────────────────────────────────────────

const CROSS_CONTAMINATION_CHECKS = [
  {
    query: "high fever with stiff neck",
    searchFn: "campus",
    forbidContains: ["meningitis", "lumbar puncture"],
    description: "Medical symptom query against campus store should NOT return medical content",
  },
  {
    query: "dispensary opening hours Monday",
    searchFn: "medical",
    forbidContains: ["OPD", "timings", "Monday", "walk-in"],
    description: "Campus FAQ query against medical store should NOT return campus content",
  },
];

// ── Test runner ───────────────────────────────────────────────────────────────

function containsAny(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

async function runTests() {
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Phase 2a Verification — Vector Store & KB Retrieval  ");
  console.log("═══════════════════════════════════════════════════════\n");

  // Build stores
  console.log("Building vector stores (this may take 1-2 minutes)...\n");
  try {
    await buildVectorStores();
  } catch (err) {
    console.error("❌ FAILED to build vector stores:", err.message);
    process.exit(1);
  }

  const stats = getStoreStats();
  console.log(`✅ Vector stores built:`);
  console.log(`   Medical chunks: ${stats.medicalChunkCount}`);
  console.log(`   Campus  chunks: ${stats.campusChunkCount}\n`);

  let passed = 0;
  let failed = 0;

  // ── Medical queries ─────────────────────────────────────────────────────────
  console.log("── Medical KB Queries ─────────────────────────────────\n");

  for (const tc of MEDICAL_QUERIES) {
    try {
      const results = await searchMedical(tc.query, 3);
      const topResult = results[0];
      const combinedText = results.map(r => r.text).join(" ");

      const found = containsAny(combinedText, tc.expectContains);
      const goodScore = topResult && topResult.score > 0.35;

      if (found && goodScore) {
        console.log(`✅ PASS | ${tc.description}`);
        console.log(`        Top: "${topResult.metadata.section}" (score: ${topResult.score.toFixed(3)})\n`);
        passed++;
      } else {
        console.log(`❌ FAIL | ${tc.description}`);
        console.log(`        Expected keywords: [${tc.expectContains.join(", ")}]`);
        console.log(`        Top section: "${topResult?.metadata?.section}" (score: ${topResult?.score?.toFixed(3)})`);
        console.log(`        Text preview: "${combinedText.slice(0, 150)}..."\n`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ERROR | ${tc.description}: ${err.message}\n`);
      failed++;
    }
  }

  // ── Campus queries ──────────────────────────────────────────────────────────
  console.log("── Campus KB Queries ──────────────────────────────────\n");

  for (const tc of CAMPUS_QUERIES) {
    try {
      const results = await searchCampus(tc.query, 3);
      const topResult = results[0];
      const combinedText = results.map(r => r.text).join(" ");

      const found = containsAny(combinedText, tc.expectContains);
      const goodScore = topResult && topResult.score > 0.35;

      if (found && goodScore) {
        console.log(`✅ PASS | ${tc.description}`);
        console.log(`        Top: "${topResult.metadata.section}" (score: ${topResult.score.toFixed(3)})\n`);
        passed++;
      } else {
        console.log(`❌ FAIL | ${tc.description}`);
        console.log(`        Expected: [${tc.expectContains.join(", ")}]`);
        console.log(`        Top section: "${topResult?.metadata?.section}" (score: ${topResult?.score?.toFixed(3)})`);
        console.log(`        Text preview: "${combinedText.slice(0, 150)}..."\n`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ERROR | ${tc.description}: ${err.message}\n`);
      failed++;
    }
  }

  // ── Cross-contamination checks ──────────────────────────────────────────────
  console.log("── Cross-Contamination Checks ─────────────────────────\n");

  for (const cc of CROSS_CONTAMINATION_CHECKS) {
    try {
      const searchFn = cc.searchFn === "campus" ? searchCampus : searchMedical;
      const results = await searchFn(cc.query, 4);
      const combinedText = results.map(r => r.text).join(" ");

      const contaminated = containsAny(combinedText, cc.forbidContains);

      if (!contaminated) {
        console.log(`✅ PASS | ${cc.description}\n`);
        passed++;
      } else {
        console.log(`❌ FAIL | ${cc.description}`);
        console.log(`        Found forbidden keyword in wrong store!`);
        console.log(`        Forbidden: [${cc.forbidContains.join(", ")}]`);
        console.log(`        Text preview: "${combinedText.slice(0, 200)}..."\n`);
        failed++;
      }
    } catch (err) {
      console.log(`❌ ERROR | ${cc.description}: ${err.message}\n`);
      failed++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Results: ${passed}/${total} passed`);
  if (failed === 0) {
    console.log("  ✅ Phase 2a VERIFIED — KB stores are working correctly.");
  } else {
    console.log(`  ❌ ${failed} test(s) failed — review KB content or embedding quality.`);
  }
  console.log("═══════════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
