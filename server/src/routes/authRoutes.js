import express from "express";
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
router.post("/register", verifyToken, async (req, res) => {
  try {
    const { uid, email, name } = req.firebaseUser;

    let user = await User.findOne({ uid });
    if (user) return res.json(user);

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
    console.error(err);
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
      return res.status(404).json({
        message: "User not registered. Please register first.",
      });
    }

    // Doctor auto-upgrade safety
    if (isDoctor && user.role !== "doctor") {
      user.role = "doctor";
      user.isApproved = true;
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});


export default router;
