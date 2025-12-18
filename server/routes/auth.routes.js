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

router.get("/me", verifyToken, async (req, res) => {
  const user = await User.findOne({ uid: req.uid });
  res.json(user);
});

export default router;
