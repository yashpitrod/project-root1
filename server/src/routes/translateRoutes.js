import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import { GoogleGenAI } from "@google/genai"; // New 2025 SDK
import 'dotenv/config';

const router = express.Router();

// 1. Initialize the new Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "No text provided" });
    }

    // 2. Use the exact model name from your curl list
    // 'gemini-3-flash-preview' is the newest 2025 model
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{
        role: "user",
        parts: [{ 
          text: `Translate the following text into English. Return ONLY the translated English text.
          
Text:
${text}` 
        }]
      }]
    });

    // 3. Access the response using the new .text property
    const translatedText = response.text.trim();

    res.json({
      success: true,
      translatedText,
    });
  } catch (err) {
    // 4. Log detailed error status for better debugging
    console.error("Translation error:", err.status || 500, err.message);
    res.status(500).json({ 
      success: false, 
      message: "Translation failed",
      details: err.message 
    });
  }
});

export default router;