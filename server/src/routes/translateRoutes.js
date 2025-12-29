import express from "express";
import { translateToEnglish } from "../utils/translate.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: "Text required" });
    }

    const translated = await translateToEnglish(text);

    res.json({
      success: true,
      translatedText: translated,
    });
  } catch (error) {
    console.error("Translate error:", error);
    res.status(500).json({ success: false, message: "Translation failed" });
  }
});

export default router;
