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
    const { id, email } = req.user;

    let user = await User.findOne({ uid: id });
    if (user) return res.json(user);

    const isDoctor = allowedDoctors.includes(email);

    const allowedRoles = ["student", "staff"];
    const role = isDoctor
      ? "doctor"
      : allowedRoles.includes(req.body.role)
      ? req.body.role
      : "student";

    user = await User.create({
      uid: id,
      email,
      name: req.body.fullName || email.split("@")[0],
      role,
      isApproved: isDoctor,
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

// ---------------- ME ----------------
router.get("/me", verifyToken, async (req, res) => {
  try {
    const { id, email } = req.user;
    const isDoctor = allowedDoctors.includes(email);

    let user = await User.findOne({ uid: id });

    if (!user) {
      user = await User.create({
        uid: id,
        email,
        name: email.split("@")[0],
        role: isDoctor ? "doctor" : "student",
        isApproved: isDoctor,
      });
    }

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
