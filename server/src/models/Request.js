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
    triageSummary: {
      type: String,
      required: true,
    },
    originalProblem: {
      type: String,
      required: true, // What student typed
    },
    extractedSymptoms: {
      type: [String],
      default: [],
    },
    riskScore: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Low",
    },
    riskPriority: {
      type: Number,
      default: 1, // Critical=4, High=3, Medium=2, Low=1
      index: true
    },
    kbCitations: [{
      source: String,
      section: String,
      text: String
    }],
    timeSlot: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          const match = v.match(/^(\d{1,2}):(\d{2}) ([AP]M) - (\d{1,2}):(\d{2}) ([AP]M)$/);
          if (!match) return false;
          
          let [, startH, startM, startP, endH, endM, endP] = match;
          startH = parseInt(startH, 10);
          startM = parseInt(startM, 10);
          endH = parseInt(endH, 10);
          endM = parseInt(endM, 10);
          
          if (startH === 12) startH = startP === 'AM' ? 0 : 12;
          else if (startP === 'PM') startH += 12;
          
          if (endH === 12) endH = endP === 'AM' ? 0 : 12;
          else if (endP === 'PM') endH += 12;
          
          const start = startH * 60 + startM;
          const end = endH * 60 + endM;
          
          return start < end;
        },
        message: 'Invalid time slot format or end time is before start time'
      },
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

// DB-04: Add compound indexes for the most common query patterns
requestSchema.index({ doctorId: 1, createdAt: -1 });
requestSchema.index({ studentId: 1, createdAt: -1 });
requestSchema.index({ doctorId: 1, status: 1, approvedAt: -1 });

export default mongoose.model("Request", requestSchema);

