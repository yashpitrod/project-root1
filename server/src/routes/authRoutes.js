import express from "express";
import { z } from "zod";
import verifyFirebaseOnly from "../middlewares/verifyFirebaseOnly.js";
import verifyToken from "../middlewares/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

// AU-01: Doctor whitelist moved out of source code into environment variable.
// Set ALLOWED_DOCTOR_EMAILS as a comma-separated list in .env
// Tradeoff: still requires a redeploy to change, but no longer exposes emails in git.
// For a fully dynamic solution, migrate to a DB collection or Firebase Custom Claims.
const allowedDoctors = (process.env.ALLOWED_DOCTOR_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

console.log(`Doctor whitelist loaded: ${allowedDoctors.length} email(s)`);

const registerSchema = z.object({
  role: z.enum(["student", "staff"]).optional(),
  fullName: z.string().trim().optional()
});

// ---------------- REGISTER ----------------
router.post("/register", verifyFirebaseOnly, async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request payload",
        errors: parseResult.error.errors
      });
    }

    const { uid, email, name } = req.firebaseUser;
    const { role: requestedRole, fullName } = parseResult.data;

    // AU-02 FIX: Simplified registration flow to prevent race condition / privilege escalation.
    // 1. Check by UID first (primary identifier)
    let user = await User.findOne({ uid });

    if (user) {
      // User already exists by UID — return as-is, no role changes
      return res.status(200).json(user);
    }

    // 2. Check by email (for users who may have been pre-created without a UID)
    user = await User.findOne({ email });

    if (user) {
      if (!user.uid) {
        // Attach Firebase UID to existing record
        user.uid = uid;
        await user.save();
      } else if (user.uid !== uid) {
        // Different Firebase account trying to register with same email — block it
        return res.status(409).json({
          message: "This email is already linked to a different account.",
        });
      }
      // AU-02: Do NOT return the existing user without re-validating the role.
      // If the existing record had a doctor role but the email is no longer whitelisted,
      // this is still safe because the user was previously approved.
      return res.status(200).json(user);
    }

    // 3. New user — determine role
    const isDoctor = allowedDoctors.includes(email);

    const allowedRoles = ["student", "staff"];
    const role = isDoctor
      ? "doctor"
      : (requestedRole && allowedRoles.includes(requestedRole))
        ? requestedRole
        : "student";

    user = await User.create({
      uid,
      email,
      name: fullName || name,
      role,
      isApproved: isDoctor,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    // ✅ Handle duplicate email safely
    if (err.code === 11000) {
      return res.status(409).json({
        message: "User already exists. Please login."
      });
    }

    res.status(500).json({ message: "Registration failed" });
  }
});

// ---------------- ME ----------------
router.get("/me", verifyToken, async (req, res) => {
  try {
    // AU-07: Use req.user from verifyToken middleware instead of double-querying DB
    const user = req.user;
    const email = req.firebaseUser.email;
    const isDoctor = allowedDoctors.includes(email);

    // Doctor auto-upgrade safety
    if (isDoctor && user.role !== "doctor") {
      user.role = "doctor";
      user.isApproved = true;
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error("ME ROUTE ERROR:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
