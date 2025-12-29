import express from "express";
import { createRequest, getDoctorRequests } from "../controllers/requestController.js";
import verifyToken from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/", verifyToken, createRequest);
router.get("/doctor", verifyToken, getDoctorRequests);

export default router;
