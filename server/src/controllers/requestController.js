import Request from "../models/Request.js";
import { translateToEnglish } from "../utils/translate.js";

/* =================================
   STUDENT: Create appointment request
================================= */
export const createRequest = async (req, res) => {
  try {
    const { problem, doctorId, timeSlot, alreadyTranslated } = req.body;

    console.log("🧑‍🎓 STUDENT creating request");
    console.log("➡ doctorId received:", doctorId);
    console.log("➡ student mongo _id:", req.user?._id);

    if (!problem || !doctorId || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const finalEnglishText = alreadyTranslated
      ? problem
      : await translateToEnglish(problem);

    const request = await Request.create({
      studentId: req.user._id,
      doctorId,
      problem: finalEnglishText,
      timeSlot,
      status: "pending",
    });
    const io = req.app.get("io");
    io.to(doctorId.toString()).emit("new-request", {
      request,
    });
    res.status(201).json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Create Request Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create request",
    });
  }
};

/* ======================================
   STUDENT: Get their past / recent requests
====================================== */
export const getStudentRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      studentId: req.user._id,
    })
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Fetch Student Requests Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student requests",
    });
  }
};

/* ==================================
   DOCTOR: Get appointments for doctor
================================== */
export const getDoctorRequests = async (req, res) => {
  try {
    console.log("👨‍⚕️ DOCTOR fetching requests");
    console.log("➡ logged doctorId:", req.user._id);

    const requests = await Request.find({
      doctorId: req.user._id,
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Fetch Doctor Requests Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctor requests",
    });
  }
};

/* ==================================
   DOCTOR: Approve / Reject appointment
================================== */
export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // 🔒 Doctor can update only their own request
    if (request.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    request.status = status;

    if (status === "approved") {
      request.approvedAt = new Date(); // Set the approvedAt timestamp
    }

    await request.save();

    /* 🔥 SOCKET: notify student in real-time */
    const io = req.app.get("io");
    io.to(request.studentId.toString()).emit("request-status-updated", {
      requestId: request._id,
      status,
    });

    res.status(200).json({
      success: true,
      request,
    });
    console.log("📤 Emitted update to student:", request.studentId.toString());
  } catch (error) {
    console.error("Update Request Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update request status",
    });
  }
};

/* ==================================
   DOCTOR: Delete appointment
================================== */
export const deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // 🔒 Doctor can delete only their own appointment
    if (request.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await request.deleteOne();

    res.status(200).json({
      success: true,
      message: "Appointment deleted",
    });
  } catch (error) {
    console.error("Delete Request Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
    });
  }
};
