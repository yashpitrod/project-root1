import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    originalText: {
      type: String,
      required: true
    },

    englishSummary: {
      type: String,
      required: true
    },

    slotTime: {
      type: Date
    },

    status: {
      type: String,
      enum: ["pending", "scheduled", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);
export default Request;
