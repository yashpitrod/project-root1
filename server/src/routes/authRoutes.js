import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

// 🔒 Prebuilt doctor email list
const allowedDoctors = [
  "champak.bhattacharyya@gmail.com",
  "sameer.patnaik@gmail.com",
  "soumyaranjan.behera@gmail.com",
  "anirban.ghosh@gmail.com",
  "savitri.munda@gmail.com",
  "kapil.meena@gmail.com"
];

/**
 * First login → store user
 * Next login → return stored user
 */
router.post("/register", verifyToken, async (req, res) => {
  try {
    // 1. Check if user already exists
    let user = await User.findOne({ uid: req.uid });
    if (user) {
      return res.json(user); // returning user
    }

    // 2. Determine role
    const email = req.email.toLowerCase();
    const isDoctor = allowedDoctors.includes(email);
    let role;
    if (isDoctor) {
      role = "doctor";
    } else {
      // Only allow valid roles from frontend (no admin signup)
      const allowedRoles = ["student", "staff"];
      role = allowedRoles.includes(req.body.role) ? req.body.role : "student";
    }

    // 3. Create user
    user = await User.create({
      uid: req.uid,
      email,
      name: req.body.fullName || "User",
      role,
      isApproved: isDoctor // doctors only if whitelisted
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

/**
 * Get logged-in user
 */
router.get("/me", verifyToken, async (req, res) => {
  let user = await User.findOne({ uid: req.uid }).select("-__v");
  const email = req.email.toLowerCase();
  const isDoctor = allowedDoctors.includes(email);
  // If user exists but should be doctor, update role
  if (user && isDoctor && user.role !== "doctor") {
    user.role = "doctor";
    user.isApproved = true;
    await user.save();
  }
  if (!user) {
    // Auto-create user in MongoDB if not found, using Firebase token info
    user = await User.create({
      uid: req.uid,
      email: req.email,
      name: req.email.split("@")[0], // fallback to email prefix as name
      role: isDoctor ? "doctor" : "student", // assign doctor if whitelisted
      isApproved: isDoctor
    });
  }
  res.json(user);
});

export default router;
