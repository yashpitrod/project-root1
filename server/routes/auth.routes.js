import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", verifyToken, async (req, res) => {
    const { role, fullName, branch, year } = req.body;

    await User.create({
        uid: req.uid,
        role,
        fullName,
        branch,
        year,
    });

    res.json({ success: true });
});

router.post("/verify-doctor-email", (req, res) => {
    const allowedDoctors = [
        "champak.bhattacharyya@nitrkl.ac.in",
        "sameer.patnaik@nitrkl.ac.in",
        "soumyaranjan.behera@nitrkl.ac.in",
        "anirban.ghosh@nitrkl.ac.in",
        "savitri.munda@nitrkl.ac.in",
        "kapil.meena@nitrkl.ac.in"
    ];

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ valid: false });
    }

    const isValid = allowedDoctors.includes(email.toLowerCase());

    res.json({ valid: isValid });
});


router.get("/me", verifyToken, async (req, res) => {
    const user = await User.findOne({ uid: req.uid });
    res.json(user);
});

export default router;
