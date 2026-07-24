import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["triage", "faq", "unknown"],
      default: "unknown",
    },
    state: {
      type: Object,
      default: {},
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index: document will auto-delete when Date.now() >= expiresAt
    },
  },
  { timestamps: true }
);

// Pre-save hook to set expiresAt to 24 hours from now if not already set
chatSessionSchema.pre("save", function () {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
});

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

export default ChatSession;
