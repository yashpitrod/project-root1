/**
 * vectorStore.js
 *
 * In-memory vector store with brute-force cosine similarity search.
 * No FAISS, no native bindings — plain JavaScript over float arrays.
 *
 * Two completely separate stores:
 *   - medicalStore  → for symptom/triage queries
 *   - campusStore   → for campus-policy/FAQ queries
 *
 * Built at server startup from the markdown KB files.
 * Embeddings use Google's gemini-embedding-001 model via @google/genai.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { splitMarkdownByHeaders } from "./markdownSplitter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Paths ──────────────────────────────────────────────────────────────────
const MEDICAL_KB_DIR = path.resolve(__dirname, "../knowledge-base/medical");
const CAMPUS_KB_DIR = path.resolve(__dirname, "../knowledge-base/campus");

// ── Gemini client (reuses GEMINI_API_KEY from env) ─────────────────────────
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ── Embedding provider configuration ───────────────────────────────────────
const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER?.toUpperCase();
const RAW_GEMINI_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL;
const EMBEDDING_MODEL = RAW_GEMINI_EMBEDDING_MODEL === "gemini-embedding-1.0"
  ? "gemini-embed-1.0"
  : RAW_GEMINI_EMBEDDING_MODEL || "gemini-embed-1.0";
const GROQ_EMBEDDING_MODEL = process.env.GROQ_EMBEDDING_MODEL || "groq-embedding-1.0";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = process.env.GROQ_API_URL || "https://api.groq.ai/v1/embeddings";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const supportedProviders = ["GEMINI", "GROQ"];
const preferredProvider = EMBEDDING_PROVIDER || (GROQ_API_KEY ? "GROQ" : "GEMINI");

if (!supportedProviders.includes(preferredProvider)) {
  throw new Error(`Unsupported EMBEDDING_PROVIDER: ${preferredProvider}. Use GEMINI or GROQ.`);
}

if (preferredProvider === "GEMINI" && !GEMINI_API_KEY && !GROQ_API_KEY) {
  throw new Error("Either GEMINI_API_KEY or GROQ_API_KEY is required to build embeddings.");
}
if (preferredProvider === "GROQ" && !GROQ_API_KEY && !GEMINI_API_KEY) {
  throw new Error("Either GROQ_API_KEY or GEMINI_API_KEY is required to build embeddings.");
}

console.log(`[VectorStore] Preferred embedding provider: ${preferredProvider}`);
console.log(`[VectorStore] Gemini model: ${EMBEDDING_MODEL}`);
console.log(`[VectorStore] Groq model: ${GROQ_EMBEDDING_MODEL}`);

// ── In-memory stores ────────────────────────────────────────────────────────
/**
 * Each entry: { text: string, embedding: number[], metadata: { source, section, heading, sourceType } }
 */
let medicalChunks = [];
let campusChunks = [];

let initialized = false;

// ── Embedding helper ─────────────────────────────────────────────────────────
/**
 * Get embedding vector for a single text string.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
  if (preferredProvider === "GROQ") {
    if (GROQ_API_KEY) {
      try {
        return await embedTextWithGroq(text);
      } catch (err) {
        console.warn(`[VectorStore] Groq failed, falling back to Gemini: ${err.message}`);
        if (GEMINI_API_KEY) {
          return await embedTextWithGemini(text);
        }
        throw err;
      }
    }
    return embedTextWithGemini(text);
  }

  if (GEMINI_API_KEY) {
    try {
      return await embedTextWithGemini(text);
    } catch (err) {
      console.warn(`[VectorStore] Gemini failed, falling back to Groq: ${err.message}`);
      if (GROQ_API_KEY) {
        return await embedTextWithGroq(text);
      }
      throw err;
    }
  }

  return embedTextWithGroq(text);
}

async function embedTextWithGemini(text) {
  const response = await geminiClient.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
  });

  const values = response?.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error(`Empty embedding returned for text: "${text.slice(0, 60)}..."`);
  }
  return values;
}

async function embedTextWithGroq(text) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is required when EMBEDDING_PROVIDER=GROQ");
  }

  const payload = {
    model: GROQ_EMBEDDING_MODEL,
    input: text,
  };

  console.log(`[VectorStore] Groq embedding request payload: ${JSON.stringify(payload).slice(0, 200)}`);

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`Groq embedding failed (${response.status}): ${bodyText}`);
  }

  const data = JSON.parse(bodyText);
  const values = data?.data?.[0]?.embedding || data?.embedding || data?.embeddings?.[0]?.values || data?.results?.[0]?.embedding;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Empty embedding returned from Groq for text: "${text.slice(0, 60)}..."`);
  }

  return values;
}

/**
 * Embed a batch of texts with a small delay between calls to respect rate limits.
 * @param {string[]} texts
 * @param {number} delayMs - Delay between calls in ms (default 200ms)
 * @returns {Promise<number[][]>}
 */
async function embedBatch(texts, delayMs = 1500) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i++) {
    if (i > 0) await sleep(delayMs);
    let success = false;
    let attempts = 0;
    while (!success && attempts < 4) {
      try {
        const emb = await embedText(texts[i]);
        embeddings.push(emb);
        success = true;
      } catch (err) {
        attempts++;
        const retryDelayMs = getRetryDelayMs(err) || 5000 * attempts;
        if (attempts >= 4) {
          console.error(`Embedding failed for chunk ${i} after 4 attempts: ${err.message}`);
          // Push null — filtered out during indexing
          embeddings.push(null);
        } else {
          console.warn(`Embedding failed for chunk ${i} (attempt ${attempts}). Retrying in ${Math.round(retryDelayMs / 1000)}s...`);
          await sleep(retryDelayMs);
        }
      }
    }
  }
  return embeddings;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryDelayMs(error) {
  if (!error || !error.details) return null;
  const retryInfo = error.details.find(detail => detail["@type"]?.includes("RetryInfo"));
  if (retryInfo?.retryDelay) {
    const match = /(?:(\d+)s)|(?:(\d+)ms)/.exec(retryInfo.retryDelay);
    if (match) {
      if (match[1]) return Number(match[1]) * 1000;
      if (match[2]) return Number(match[2]);
    }
  }
  return null;
}

// ── Cosine similarity ────────────────────────────────────────────────────────
/**
 * Compute cosine similarity between two equal-length float vectors.
 * Returns a value between -1 and 1 (higher = more similar).
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

// ── Indexing ─────────────────────────────────────────────────────────────────
/**
 * Load, chunk, and embed all markdown files in a directory.
 * @param {string} dirPath       - Directory containing .md files
 * @param {string} sourceType    - "medical" | "campus"
 * @returns {Promise<Array>}     - Array of { text, embedding, metadata }
 */
async function indexDirectory(dirPath, sourceType) {
  const files = (await fs.readdir(dirPath)).filter(f => f.endsWith(".md"));

  if (files.length === 0) {
    console.warn(`[VectorStore] No .md files found in ${dirPath}`);
    return [];
  }

  console.log(`[VectorStore] Indexing ${files.length} ${sourceType} documents...`);

  const allChunks = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = await fs.readFile(filePath, "utf-8");
    const rawChunks = splitMarkdownByHeaders(content, file);

    for (const chunk of rawChunks) {
      allChunks.push({
        text: chunk.text,
        metadata: {
          ...chunk.metadata,
          sourceType,
          filePath: filePath,
        },
      });
    }
  }

  console.log(`[VectorStore] ${sourceType}: ${allChunks.length} chunks from ${files.length} files. Embedding...`);

  // Embed all chunks
  const texts = allChunks.map(c => c.text);
  const embeddings = await embedBatch(texts, 1000); // 1000ms between calls

  // Merge embeddings with chunk metadata, skip failed embeddings
  const indexed = [];
  for (let i = 0; i < allChunks.length; i++) {
    if (embeddings[i] === null) {
      console.warn(`[VectorStore] Skipping chunk ${i} (${allChunks[i].metadata.section}) — embedding failed`);
      continue;
    }
    indexed.push({
      text: allChunks[i].text,
      embedding: embeddings[i],
      metadata: allChunks[i].metadata,
    });
  }

  console.log(`[VectorStore] ${sourceType}: ${indexed.length}/${allChunks.length} chunks indexed successfully.`);
  return indexed;
}

// ── Build / Init ─────────────────────────────────────────────────────────────
/**
 * Build both vector stores from the markdown KB files.
 * Called once at server startup. Logs progress throughout.
 */
export async function buildVectorStores() {
  if (initialized) {
    console.log("[VectorStore] Already initialized, skipping rebuild.");
    return;
  }

  console.log("[VectorStore] Starting KB build...");
  const startTime = Date.now();

  try {
    [medicalChunks, campusChunks] = await Promise.all([
      indexDirectory(MEDICAL_KB_DIR, "medical"),
      indexDirectory(CAMPUS_KB_DIR, "campus"),
    ]);

    initialized = true;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[VectorStore] Build complete in ${elapsed}s — Medical: ${medicalChunks.length} chunks, Campus: ${campusChunks.length} chunks`);
  } catch (err) {
    console.error("[VectorStore] Build failed:", err.message);
    throw err;
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
/**
 * Internal search function over a specific chunk array.
 * @param {string} query    - Natural language query
 * @param {Array}  store    - medicalChunks or campusChunks
 * @param {number} k        - Number of top results to return
 * @returns {Promise<Array<{text, metadata, score}>>}
 */
async function searchStore(query, store, k = 4) {
  if (store.length === 0) {
    console.warn("[VectorStore] Search called on empty store.");
    return [];
  }

  const queryEmbedding = await embedText(query);

  // Compute cosine similarity for every chunk
  const scored = store.map(chunk => ({
    text: chunk.text,
    metadata: chunk.metadata,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort descending by score, return top-k
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

/**
 * Search the MEDICAL knowledge base.
 * Use for symptom and triage queries.
 *
 * @param {string} query
 * @param {number} k  - Number of results (default 4)
 * @returns {Promise<Array<{text: string, metadata: object, score: number}>>}
 */
export async function searchMedical(query, k = 4) {
  if (!initialized) {
    throw new Error("[VectorStore] Not initialized. Call buildVectorStores() at startup.");
  }
  return searchStore(query, medicalChunks, k);
}

/**
 * Search the CAMPUS FAQ knowledge base.
 * Use for policy, scheduling, and dispensary queries.
 *
 * @param {string} query
 * @param {number} k  - Number of results (default 4)
 * @returns {Promise<Array<{text: string, metadata: object, score: number}>>}
 */
export async function searchCampus(query, k = 4) {
  if (!initialized) {
    throw new Error("[VectorStore] Not initialized. Call buildVectorStores() at startup.");
  }
  return searchStore(query, campusChunks, k);
}

/**
 * Returns basic stats about the current state of the vector stores.
 * Useful for health checks and debugging.
 */
export function getStoreStats() {
  return {
    initialized,
    medicalChunkCount: medicalChunks.length,
    campusChunkCount: campusChunks.length,
  };
}
