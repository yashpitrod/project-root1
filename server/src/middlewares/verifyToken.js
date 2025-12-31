import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";

/* ---------------- PATH SETUP ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------- FIREBASE INIT ---------------- */
const serviceAccountPath = path.join(
  __dirname,
  "../config/firebaseServiceAccount.json"
);

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, "utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/* ---------------- VERIFY TOKEN ---------------- */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 🔐 Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded.email) {
      return res.status(401).json({ message: "Token missing email" });
    }

    /* 🔥 Firebase identity (always available) */
    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      name: decoded.name || decoded.email.split("@")[0],
    };

    /* 🔥 MongoDB user (required for protected routes) */
    const mongoUser = await User.findOne({ uid: decoded.uid });

    if (!mongoUser) {
      return res.status(401).json({
        message: "User not registered in database",
      });
    }

    /* ✅ Attach Mongo user (THIS FIXES req.user._id) */
    req.user = mongoUser;

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
