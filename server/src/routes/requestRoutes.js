import express from "express";
import {
  createRequest,
  getStudentRequests,
  getDoctorRequests,
  updateRequestStatus,
  deleteRequest,
  getDoctorStats,
  getStudentHistoryForDoctor
} from "../controllers/requestController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, createRequest);
router.get("/my", verifyToken, getStudentRequests);
router.get("/doctor", verifyToken, getDoctorRequests);
router.get("/doctor/stats", verifyToken, getDoctorStats);
router.get("/student/:studentId/history", verifyToken, getStudentHistoryForDoctor);
router.patch("/:requestId/status", verifyToken, updateRequestStatus);
router.delete("/:requestId", verifyToken, deleteRequest);

export default router;
