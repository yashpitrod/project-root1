import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { translateToEnglish } from "../config/gemini.js";

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "No text provided" });
    }

    const translatedText = await translateToEnglish(text);

    res.json({
      success: true,
      translatedText,
    });
  } catch (err) {
    console.error("Translation route error:", err.message);
    res.status(500).json({
      success: false,
      message: "Translation failed",
    });
  }
});

export default router;