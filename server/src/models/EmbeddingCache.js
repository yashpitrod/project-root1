import mongoose from "mongoose";

// KB-02: Persists embeddings across restarts/redeploys so buildVectorStores()
// doesn't re-embed unchanged KB content every time the server boots. Render's
// filesystem is ephemeral on redeploy, but MongoDB is not — so we cache here
// instead of on disk.
const embeddingCacheSchema = new mongoose.Schema(
  {
    // SHA256 of `${model}:${text}` — uniquely identifies a (model, content) pair.
    hash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmbeddingCache", embeddingCacheSchema);