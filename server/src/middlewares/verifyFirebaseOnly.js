import admin from "../config/firebaseAdmin.js";

const verifyFirebaseOnly = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ No Authorization header");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    console.log("✅ FIREBASE TOKEN VERIFIED:", decoded.email);

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email.toLowerCase(),
      name: decoded.name || decoded.email.split("@")[0],
    };

    next();
  } catch (err) {
    console.error("❌ FIREBASE ADMIN VERIFY FAILED:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyFirebaseOnly;
