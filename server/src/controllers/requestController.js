import Request from "../models/Request.js";
import { translateToEnglish } from "../utils/translate.js";

/**
 * STUDENT: Create appointment request
 */
export const createRequest = async (req, res) => {
  try {
    const { problem, doctorId, timeSlot, alreadyTranslated } = req.body;

    if (!problem || !doctorId || !timeSlot) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Always save English text
    const finalEnglishText = alreadyTranslated
      ? problem
      : await translateToEnglish(problem);

    const request = await Request.create({
      studentId: req.user.uid,   // ✅ Firebase UID (string)
      doctorId: doctorId,        // ✅ Firebase UID (string)
      problemEnglish: finalEnglishText,
      timeSlot,
    });

    res.status(201).json(request);
  } catch (error) {
    console.error("Create Request Error:", error);
    res.status(500).json({ message: "Failed to create request" });
  }
};

/**
 * DOCTOR: Get only their appointments
 */
export const getDoctorRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      doctorId: req.user.uid,   // ✅ Firebase UID
    });

    res.status(200).json(requests);
  } catch (error) {
    console.error("Fetch Doctor Requests Error:", error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};
