import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import User from "../models/User.js";

const router = express.Router();

/* ===============================
   UPDATE DOCTOR AVAILABILITY
================================ */
router.put("/status", verifyToken, async (req, res) => {
  try {
    const { id } = req.user;
    const { availability } = req.body;

    if (!["available", "busy"].includes(availability)) {
      return res.status(400).json({ message: "Invalid availability" });
    }

    const doctor = await User.findOneAndUpdate(
      { uid: id, role: "doctor" },
      { availability },
      { new: true }
    );

    if (!doctor) {
      return res.status(403).json({ message: "Not a doctor" });
    }

    /* 🔴 EMIT SOCKET EVENT */
    const io = req.app.get("io");
    io.emit("doctor-status-updated", {
      doctorId: doctor._id.toString(),
      availability: doctor.availability,
    });

    res.json({
      success: true,
      availability: doctor.availability,
    });
  } catch (err) {
    console.error("Doctor status error:", err.message);
    res.status(500).json({ message: "Failed to update doctor status" });
  }
});

/* ===============================
   GET ALL DOCTORS (STUDENT SIDE)
================================ */
router.get("/", async (req, res) => {
  const doctors = await User.find(
    { role: "doctor", isApproved: true },
    "name email availability"
  );
  res.json(doctors);
});

export default router;
