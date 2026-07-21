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

const normalizeEmail = (value) => (value || "").trim().toLowerCase();

const serializeUser = (user) => ({
  _id: user._id,
  uid: user.uid,
  email: user.email,
  name: user.name,
  role: user.role,
  provider: user.provider,
  emailVerified: user.emailVerified,
  isApproved: user.isApproved,
  availability: user.availability,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const syncUserFromFirebase = async ({ uid, email, name, provider = "firebase", requestedRole }) => {
  const normalizedEmail = normalizeEmail(email);
  const safeName = (name || normalizedEmail.split("@")[0] || "Campus User").trim();
  const isDoctor = allowedDoctors.includes(normalizedEmail);
  const allowedRoles = ["student", "staff"];
  const baseRole = isDoctor
    ? "doctor"
    : (requestedRole && allowedRoles.includes(requestedRole))
      ? requestedRole
      : "student";

  const [byUidUser, byEmailUser] = await Promise.all([
    User.findOne({ uid }).lean(),
    User.findOne({ email: normalizedEmail }).lean(),
  ]);

  if (byUidUser) {
    const nextRole = isDoctor ? "doctor" : byUidUser.role || baseRole;
    const nextApproved = isDoctor || byUidUser.isApproved;

    const updated = await User.findOneAndUpdate(
      { uid },
      {
        $set: {
          email: normalizedEmail,
          name: safeName,
          provider,
          lastLoginAt: new Date(),
          role: nextRole,
          isApproved: nextApproved,
          emailVerified: true,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    return serializeUser(updated);
  }

  if (byEmailUser) {
    if (!byEmailUser.uid) {
      const updated = await User.findOneAndUpdate(
        { email: normalizedEmail },
        { $set: { uid, provider, lastLoginAt: new Date(), emailVerified: true } },
        { new: true, runValidators: true }
      ).lean();
      return serializeUser(updated);
    }

    if (byEmailUser.uid !== uid) {
      const error = new Error("This email is already linked to a different account.");
      error.statusCode = 409;
      throw error;
    }

    const nextRole = isDoctor ? "doctor" : byEmailUser.role || baseRole;
    const nextApproved = isDoctor || byEmailUser.isApproved;

    const updated = await User.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          name: safeName,
          provider,
          lastLoginAt: new Date(),
          role: nextRole,
          isApproved: nextApproved,
          emailVerified: true,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    return serializeUser(updated);
  }

  const created = await User.create({
    uid,
    email: normalizedEmail,
    name: safeName,
    role: baseRole,
    provider,
    isApproved: isDoctor,
    emailVerified: true,
    lastLoginAt: new Date(),
  });

  return serializeUser(created);
};

// ---------------- SYNC ----------------
router.post("/sync", verifyFirebaseOnly, async (req, res) => {
  try {
    const { role: requestedRole, fullName, provider } = req.body || {};
    const user = await syncUserFromFirebase({
      uid: req.firebaseUser.uid,
      email: req.firebaseUser.email,
      name: fullName || req.firebaseUser.name,
      provider: provider || req.firebaseUser.provider || "firebase",
      requestedRole,
    });

    res.status(200).json(user);
  } catch (err) {
    console.error("SYNC ERROR:", err.message);

    if (err.code === 11000) {
      return res.status(409).json({ message: "User already exists. Please login." });
    }

    if (err.statusCode === 409) {
      return res.status(409).json({ message: err.message });
    }

    res.status(500).json({ message: "Authentication sync failed" });
  }
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

    const { role: requestedRole, fullName } = parseResult.data;
    const user = await syncUserFromFirebase({
      uid: req.firebaseUser.uid,
      email: req.firebaseUser.email,
      name: fullName || req.firebaseUser.name,
      provider: req.firebaseUser.provider || "firebase",
      requestedRole,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error("REGISTER ERROR:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "User already exists. Please login."
      });
    }

    if (err.statusCode === 409) {
      return res.status(409).json({ message: err.message });
    }

    res.status(500).json({ message: "Registration failed" });
  }
});

// ---------------- ME ----------------
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await syncUserFromFirebase({
      uid: req.firebaseUser.uid,
      email: req.firebaseUser.email,
      name: req.firebaseUser.name,
      provider: req.firebaseUser.provider || "firebase",
      requestedRole: req.user?.role,
    });

    res.json(user);
  } catch (err) {
    console.error("ME ROUTE ERROR:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
