import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

// 🔒 Prebuilt doctor email list
const allowedDoctors = [
  "champak.bhattacharyya@nitrkl.ac.in",
  "sameer.patnaik@nitrkl.ac.in",
  "soumyaranjan.behera@nitrkl.ac.in",
  "anirban.ghosh@nitrkl.ac.in",
  "savitri.munda@nitrkl.ac.in",
  "kapil.meena@nitrkl.ac.in"
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

    // 2. Auto-detect role
    const email = req.email.toLowerCase();
    const isDoctor = allowedDoctors.includes(email);

    const role = isDoctor ? "doctor" : "student";

    // 3. Create user
    user = await User.create({
      uid: req.uid,
      email,
      name: req.body.name || "User",
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
  const user = await User.findOne({ uid: req.uid }).select("-__v");
  res.json(user);
});

export default router;

// import express from "express";
// import { verifyToken } from "../middlewares/verifyToken.js";
// import User from "../models/User.js";

// const router = express.Router();

// router.post("/register", verifyToken, async (req, res) => {
//     const { role, fullName, branch, year } = req.body;

//     await User.create({
//         uid: req.uid,
//         role,
//         fullName,
//         branch,
//         year,
//     });

//     res.json({ success: true });
// });

// router.post("/verify-doctor-email", (req, res) => {
//     const allowedDoctors = [
//         "champak.bhattacharyya@nitrkl.ac.in",
//         "sameer.patnaik@nitrkl.ac.in",
//         "soumyaranjan.behera@nitrkl.ac.in",
//         "anirban.ghosh@nitrkl.ac.in",
//         "savitri.munda@nitrkl.ac.in",
//         "kapil.meena@nitrkl.ac.in"
//     ];

//     const { email } = req.body;

//     if (!email) {
//         return res.status(400).json({ valid: false });
//     }

//     const isValid = allowedDoctors.includes(email.toLowerCase());

//     res.json({ valid: isValid });
// });


// router.get("/me", verifyToken, async (req, res) => {
//     const user = await User.findOne({ uid: req.uid });
//     res.json(user);
// });

// export default router;
