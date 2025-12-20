import Request from "../models/Request.js";
import User from "../models/User.js";
import { summarizeText } from "../config/gemini.js";
import { allocateSlot } from "../utils/slotAllocator.js";

/**
 * Student submits a health request
 */
export const createRequest = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Problem text is required" });
    }

    // 1. Get logged-in user
    const user = await User.findOne({ uid: req.uid });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Gemini: translate + summarize
    const summary = await summarizeText(text);

    // 3. Allocate slot (simple logic)
    const slotTime = await allocateSlot();

    // 4. Save request
    const request = await Request.create({
      user: user._id,
      originalText: text,
      englishSummary: summary,
      slotTime,
      status: "scheduled"
    });

    res.json({
      message: "Request submitted successfully",
      request
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create request" });
  }
};
