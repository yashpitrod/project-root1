import Request from "../models/Request.js";
import User from "../models/User.js"; // CT-01: Needed for doctorId validation
import mongoose from "mongoose";
import { translateToEnglish } from "../config/gemini.js";
import { z } from "zod";

const createRequestSchema = z.object({
  problem: z.string().trim().min(1, "Problem description is required").max(2000, "Problem description is too long (maximum 2000 characters)"),
  doctorId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid doctor ID"),
  timeSlot: z.string().min(1, "Time slot is required"),
  alreadyTranslated: z.boolean().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(["approved", "rejected"], { required_error: "Invalid status" })
});

/* =================================
   STUDENT: Create appointment request
================================= */
export const createRequest = async (req, res) => {
  try {
    // AU-04: Only students and staff can create appointment requests
    if (req.user.role === "doctor") {
      return res.status(403).json({
        success: false,
        message: "Doctors cannot create appointment requests",
      });
    }

    const parseResult = createRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || "Invalid request payload",
        errors: parseResult.error.errors
      });
    }

    const { problem, doctorId, timeSlot, alreadyTranslated } = parseResult.data;

    // CT-01: Validate that doctorId references a real, approved doctor
    const doctor = await User.findOne({
      _id: doctorId,
      role: "doctor",
      isApproved: true,
    });
    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: "Invalid or unavailable doctor selected",
      });
    }

    const finalEnglishText = alreadyTranslated
      ? problem
      : await translateToEnglish(problem);

    const request = await Request.create({
      studentId: req.user._id,
      doctorId,
      originalProblem: problem,        // 👈 RAW USER INPUT
      problem: finalEnglishText,        // 👈 ENGLISH ONLY,
      timeSlot,
      status: "pending",
    });
    const io = req.app.get("io");
    if (io) {
      io.to(doctorId.toString()).emit("new-request", {
        request,
      });
    }
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
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const query = { studentId: req.user._id };
    
    const [requests, totalCount] = await Promise.all([
      Request.find(query)
        .populate("doctorId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Request.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      }
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
    // AU-03: Only doctors can view their appointment queue
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access this endpoint",
      });
    }

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 20;
    if (limit > 50) limit = 50;

    const skip = (page - 1) * limit;

    const query = { doctorId: req.user._id };

    const [requests, totalCount] = await Promise.all([
      Request.find(query)
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Request.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      requests,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      }
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
    
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format",
      });
    }

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
        errors: parseResult.error.errors
      });
    }

    const { status } = parseResult.data;

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
    if (io) {
      io.to(request.studentId.toString()).emit("request-status-updated", {
        requestId: request._id,
        status,
      });
    }

    res.status(200).json({
      success: true,
      request,
    });

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

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format",
      });
    }

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
