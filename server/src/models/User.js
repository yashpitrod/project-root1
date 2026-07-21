import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["student", "staff", "doctor", "admin"],
      required: true
    },

    provider: {
      type: String,
      enum: ["firebase", "google", "email", "unknown"],
      default: "firebase"
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    lastLoginAt: {
      type: Date,
      default: null
    },

    // Doctor-only fields
    isApproved: {
      type: Boolean,
      default: false // DB-05: Default to false for safety
    },

    availability: {
      type: String,
      enum: ["available", "busy", "emergency"],
      default: "available"
    }
  },
  { timestamps: true }
);

userSchema.index({ uid: 1 }, { unique: true, name: "uid_idx" });
userSchema.index({ email: 1 }, { unique: true, name: "email_idx" });

const User = mongoose.model("User", userSchema);
export default User;
