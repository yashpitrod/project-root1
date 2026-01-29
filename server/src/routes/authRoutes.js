import express from "express";
import verifyFirebaseOnly from "../middlewares/verifyFirebaseOnly.js";
import verifyToken from "../middlewares/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

const allowedDoctors = [
  "champak.bhattacharyya@gmail.com",
  "sameer.patnaik@gmail.com",
  "soumyaranjan.behera@gmail.com",
  "anirban.ghosh@gmail.com",
  "savitri.munda@gmail.com",
  "kapil.meena@gmail.com",
];

// ---------------- REGISTER ----------------
router.post("/register", verifyFirebaseOnly, async (req, res) => {
  console.log("🔥 REGISTER ROUTE HIT");
  console.log("🔥 FIREBASE USER:", req.firebaseUser);
  try {
    const { uid, email, name } = req.firebaseUser;

    // ✅ Check by UID OR email
    let user = await User.findOne({ uid });

    if (!user) {
      user = await User.findOne({ email });
      if (user && !user.uid) {
        user.uid = uid;
        await user.save();
      }
    }

    if (user) {
      // 🔥 Ensure UID is attached if missing
      if (!user.uid) {
        user.uid = uid;
        await user.save();
      }
      return res.status(200).json(user);
    }

    const isDoctor = allowedDoctors.includes(email);

    const allowedRoles = ["student", "staff", "admin"];
    const role = isDoctor
      ? "doctor"
      : allowedRoles.includes(req.body.role)
        ? req.body.role
        : "student";

    user = await User.create({
      uid,
      email,
      name: req.body.fullName || name,
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
    const { uid, email, name } = req.firebaseUser;
    const isDoctor = allowedDoctors.includes(email);

    let user = await User.findOne({ uid });

    if (!user) {
      return res.status(403).json({ message: "User exists in Firebase but not DB" });
    }

    // Doctor auto-upgrade safety
    if (isDoctor && user.role !== "doctor") {
      user.role = "doctor";
      user.isApproved = true;
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error("ME ROUTE ERROR:", err.message, err.code);
    if (err.code === 11000) {
      return res.status(409).json({ message: "User conflict" });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;
