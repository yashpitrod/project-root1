import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

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

    req.user = mongoUser || null;
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
