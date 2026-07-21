import Request from "../models/Request.js";
import User from "../models/User.js"; // CT-01: Needed for doctorId validation
import ChatSession from "../models/ChatSession.js"; // SEC-01: Server-side triage data lookup
import mongoose from "mongoose";

import { z } from "zod";

// SEC-01: Client only submits sessionId + doctor/time-slot selection.
// All triage data (riskScore, symptoms, summary, citations) is pulled
// server-side from the ChatSession document written by the pipeline.
const createRequestSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  doctorId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), "Invalid doctor ID"),
  timeSlot: z.string().min(1, "Time slot is required"),
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

    const { sessionId, doctorId, timeSlot } = parseResult.data;

    // SEC-01: Look up the ChatSession and pull triage data from the server-written state.
    // This prevents any client from fabricating riskScore, symptoms, or summary.
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      return res.status(400).json({
        success: false,
        message: "No active chat session found for this request. Please complete the triage chat first.",
      });
    }

    if (chatSession.mode !== "triage") {
      return res.status(400).json({
        success: false,
        message: "Only triage sessions can create appointment requests.",
      });
    }

    if (!chatSession.state?.triageComplete) {
      return res.status(400).json({
        success: false,
        message: "Triage is not complete. Please finish the chat conversation first.",
      });
    }

    // SEC-01: Verify the session belongs to this user
    if (chatSession.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "This session does not belong to you.",
      });
    }

    // Pull all triage data from the trusted, pipeline-written session state
    const triageSummary = chatSession.state.finalSummary || "Triage completed via AI assistant.";
    const extractedSymptoms = chatSession.state.extractedSymptoms || [];
    const riskScore = chatSession.state.riskScore || "Low";
    const kbCitations = (chatSession.state.retrievedCitations || []).map(c => ({
      source: c.source || "",
      section: c.section || "",
      text: c.text || ""
    }));
    // Use the first user message as the originalProblem
    const firstUserMsg = chatSession.state.conversationHistory?.find(m => m.role === "user");
    const originalProblem = firstUserMsg?.content || triageSummary;

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

    const priorities = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
    const pLevel = priorities[riskScore] || 1;

    const request = await Request.create({
      studentId: req.user._id,
      doctorId,
      triageSummary,
      originalProblem,
      timeSlot,
      extractedSymptoms,
      kbCitations,
      riskScore,
      riskPriority: pLevel,
      status: "pending",
    });
    const io = req.app.get("io");
    if (io) {
      io.to(doctorId.toString()).emit("new-request", {
        request,
      });
      if (riskScore === "Critical") {
        io.to(doctorId.toString()).emit("emergency-alert", {
          message: "A critical triage request requires your immediate attention!",
          request,
        });
      }
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
        .sort({ riskPriority: -1, createdAt: -1 })
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
