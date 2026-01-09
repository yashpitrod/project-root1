import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import User from "../models/User.js";
import Request from "../models/Request.js";

const router = express.Router();
/* =========================================
   GET DOCTOR QUEUE (last 1 hour approved)
========================================= */
router.get("/:doctorId/queue", verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const queueCount = await Request.countDocuments({
      doctorId,
      status: "approved",
      approvedAt: { $gte: oneHourAgo },
    });

    res.json({ queue: queueCount });
  } catch (err) {
    console.error("Queue fetch error:", err.message);
    res.status(500).json({ message: "Failed to fetch queue" });
  }
});

/* =========================================
   UPDATE DOCTOR AVAILABILITY (DOCTOR ONLY)
========================================= */
router.put("/status", verifyToken, async (req, res) => {
  try {
    const doctorId = req.user._id; // ✅ MongoDB _id
    const { availability } = req.body;

    if (!["available", "busy"].includes(availability)) {
      return res.status(400).json({ message: "Invalid availability" });
    }

    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Not a doctor" });
    }

    const doctor = await User.findByIdAndUpdate(
      doctorId,
      { availability },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    /* 🔴 SOCKET BROADCAST TO STUDENTS */
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

/* =========================================
   GET ALL DOCTORS (STUDENT SIDE)
========================================= */
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find(
      {
        role: "doctor",       // ✅ ONLY doctors
        isApproved: true,     // ✅ ONLY approved doctors
      },
      "_id name email availability"
    );

    res.json(doctors);
  } catch (err) {
    console.error("Fetch doctors error:", err.message);
    res.status(500).json({ message: "Failed to fetch doctors" });
  }
});

export default router;
