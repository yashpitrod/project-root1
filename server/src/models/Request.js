import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,   // ✅ Firebase UID
      required: true,
    },
    doctorId: {
      type: String,   // ✅ Firebase UID
      required: true,
    },
    problemEnglish: {
      type: String,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);
