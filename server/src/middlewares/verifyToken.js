import admin from "../config/firebaseAdmin.js";
import User from "../models/User.js";

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const mongoUser = await User.findOne({ uid: decoded.uid });

    // 🔴 BLOCK HERE — DO NOT CONTINUE
    if (!mongoUser) {
      return res.status(403).json({
        message: "User not registered. Please register first.",
      });
    }

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      name: decoded.name || decoded.email.split("@")[0],
    };

    req.user = mongoUser;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyToken;
