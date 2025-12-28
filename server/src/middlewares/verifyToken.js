import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, "../config/firebaseServiceAccount.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    // attach identity to request
    req.uid = decoded.uid;
    req.email = decoded.email;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


// ⚠️ TEMPORARY AUTH BYPASS FOR LOCAL DEVELOPMENT
// REMOVE THIS FILE CONTENT WHEN FIREBASE SERVICE ACCOUNT IS AVAILABLE

// export const verifyToken = async (req, res, next) => {
//   // Fake logged-in user (student by default)
//   req.uid = "temp-uid-123";
//   req.email = "test.student@gmail.com";

//   next();
// };
