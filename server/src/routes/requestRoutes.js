import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { createRequest } from "../controllers/requestController.js";

const router = express.Router();

/**
 * Student submits a health request
 * Protected route (Firebase Auth)
 */
router.post("/", verifyToken, createRequest);

export default router;

