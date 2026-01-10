import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",          // Student user
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",          // Doctor user
      required: true,
    },
    problem: {
      type: String,
      required: true, // English (final)
    },
    originalProblem: {
      type: String,
      required: true, // What student typed
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Timestamp when the request was approved
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);
