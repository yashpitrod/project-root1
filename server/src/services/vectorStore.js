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
 * Embeddings use a deterministic local token embedding so the knowledge base
 * does not require a second provider account.
 */

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { splitMarkdownByHeaders } from "./markdownSplitter.js";
import EmbeddingCache from "../models/EmbeddingCache.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Paths ──────────────────────────────────────────────────────────────────
const MEDICAL_KB_DIR = path.resolve(__dirname, "../knowledge-base/medical");
const CAMPUS_KB_DIR = path.resolve(__dirname, "../knowledge-base/campus");

// ── Embedding provider configuration ───────────────────────────────────────
const EMBEDDING_MODEL = "local-token-hash-v1";

console.log(`[VectorStore] Embedding provider: ${EMBEDDING_MODEL}`);

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
  return localEmbedding(text);
}

const LOCAL_EMBEDDING_DIMENSIONS = 384;

function localEmbedding(text) {
  const vector = new Array(LOCAL_EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.toLowerCase().match(/[a-z0-9]+/g) || [];

  for (const token of tokens) {
    const digest = crypto.createHash("sha256").update(token).digest();
    const index = digest.readUInt32BE(0) % LOCAL_EMBEDDING_DIMENSIONS;
    vector[index] += digest[4] % 2 === 0 ? 1 : -1;
  }

  return vector;
}

/**
 * Compute the cache key for a given (model, text) pair.
 * @param {string} text
 * @returns {string}
 */
function hashChunk(text) {
  return crypto.createHash("sha256").update(`${EMBEDDING_MODEL}:${text}`).digest("hex");
}

/**
 * Embed a list of texts, reusing cached embeddings from MongoDB wherever
 * possible and only calling the Gemini API for chunks that are new or have
 * changed since the last successful build.
 *
 * KB-02: Writes each successful embedding to the cache immediately (not in a
 * bulk write at the end) so that a mid-run restart/redeploy only loses the
 * one in-flight chunk, not everything embedded before it.
 *
 * Local embeddings are computed synchronously per uncached chunk, while the
 * cache still prevents repeat work across restarts.
 *
 * @param {string[]} texts
 * @param {number} delayMs - Delay between live API calls in ms
 * @returns {Promise<number[][]>}
 */
async function embedChunksWithCache(texts, delayMs = 1500) {
  const hashes = texts.map(hashChunk);

  // Bulk-check the cache once instead of one query per chunk.
  const cached = await EmbeddingCache.find({ hash: { $in: hashes } }).lean();
  const cacheByHash = new Map(cached.map(doc => [doc.hash, doc.embedding]));

  const embeddings = new Array(texts.length).fill(null);
  let cacheHits = 0;
  let firstLiveCall = true;

  for (let i = 0; i < texts.length; i++) {
    const hash = hashes[i];
    const existing = cacheByHash.get(hash);
    if (existing) {
      embeddings[i] = existing;
      cacheHits++;
      continue;
    }

    // Only throttle between *live* API calls — cache hits are free and instant.
    if (!firstLiveCall) await sleep(delayMs);
    firstLiveCall = false;

    let success = false;
    let attempts = 0;
    while (!success && attempts < 4) {
      try {
        const emb = await embedText(texts[i]);
        embeddings[i] = emb;
        success = true;

        // Persist immediately so this chunk survives a restart even if a
        // later chunk in this same run fails or the process is killed.
        try {
          await EmbeddingCache.updateOne(
            { hash },
            { $set: { hash, model: EMBEDDING_MODEL, embedding: emb } },
            { upsert: true }
          );
        } catch (cacheErr) {
          console.warn(`[VectorStore] Failed to persist cache entry for chunk ${i}: ${cacheErr.message}`);
        }
      } catch (err) {
        attempts++;
        const retryDelayMs = getRetryDelayMs(err) ?? 5000 * attempts;
        if (attempts >= 4) {
          console.error(`Embedding failed for chunk ${i} after 4 attempts: ${err.message}`);
          // Leave as null — filtered out during indexing
        } else {
          console.warn(`Embedding failed for chunk ${i} (attempt ${attempts}): ${err.message}. Retrying in ${Math.round(retryDelayMs / 1000)}s...`);
          await sleep(retryDelayMs);
        }
      }
    }
  }

  if (cacheHits > 0) {
    console.log(`[VectorStore] Reused ${cacheHits}/${texts.length} embeddings from cache.`);
  }

  return embeddings;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract a server-specified retry delay (in ms) from a provider error.
 *
 * Some providers expose the full JSON error body as a string inside
 * `error.message`, so parse it when available rather than relying on a
 * provider-specific error shape.
 *
 * The previous regex (`/(?:(\d+)s)|(?:(\d+)ms)/`) also only matched
 * integer seconds, but the API returns fractional values like
 * "24.919247084s". That caused the regex to match a suffix of the digits
 * (e.g. "919247084") as a millisecond value instead — effectively a random
 * ~29-year delay — so the match "succeeded" but produced garbage, and the
 * intended fixed-backoff fallback never kicked in either.
 *
 * @param {Error} error
 * @returns {number|null} delay in milliseconds, or null if not present/parseable
 */
function getRetryDelayMs(error) {
  if (!error || typeof error.message !== "string") return null;

  try {
    // error.message is the raw response body serialized as JSON text, e.g.
    // {"error":{"code":429,...,"details":[...,{"@type":"...RetryInfo","retryDelay":"24.9s"}]}}
    const parsed = JSON.parse(error.message);
    const details = parsed?.error?.details;
    if (!Array.isArray(details)) return null;

    const retryInfo = details.find(detail => detail["@type"]?.includes("RetryInfo"));
    const retryDelay = retryInfo?.retryDelay;
    if (typeof retryDelay !== "string") return null;

    // Match decimal seconds ("24.919247084s") or decimal milliseconds ("500ms").
    const match = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(retryDelay.trim());
    if (!match) return null;

    const value = Number(match[1]);
    if (Number.isNaN(value)) return null;

    return match[2] === "s" ? Math.ceil(value * 1000) : Math.ceil(value);
  } catch {
    // error.message wasn't JSON (e.g. a network error, not a 429) — fall
    // back to the caller's fixed exponential backoff.
    return null;
  }
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

  // Embed all chunks (cache-aware — only uncached/changed chunks hit the API)
  const texts = allChunks.map(c => c.text);
  const embeddings = await embedChunksWithCache(texts, 1000); // 1000ms between live calls

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
    // Sequential, not Promise.all — running both KBs in parallel doubles the
    // concurrent request rate against Gemini's per-minute embedding quota,
    // which is almost certainly why chunk 0 fails on both stores at once.
    medicalChunks = await indexDirectory(MEDICAL_KB_DIR, "medical");
    campusChunks = await indexDirectory(CAMPUS_KB_DIR, "campus");

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