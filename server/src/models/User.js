import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: ["student", "doctor", "admin"],
      required: true
    },

    // Doctor-only fields
    isApproved: {
      type: Boolean,
      default: true
    },

    availability: {
      type: String,
      enum: ["available", "busy", "emergency"],
      default: "available"
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
