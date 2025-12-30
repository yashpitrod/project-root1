import express from "express";
import {
  createRequest,
  getStudentRequests,
  getDoctorRequests,
  updateRequestStatus,
} from "../controllers/requestController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, createRequest);
router.get("/my", verifyToken, getStudentRequests);
router.get("/doctor", verifyToken, getDoctorRequests);
router.patch("/:requestId/status", verifyToken, updateRequestStatus);


export default router;
