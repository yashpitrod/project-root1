import admin from "../config/firebaseAdmin.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.uid = decodedToken.uid;
    req.email = decodedToken.email;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// import admin from "firebase-admin";

// admin.initializeApp({
//   credential: admin.credential.cert(
//     JSON.parse(process.env.FIREBASE_SERVICE_KEY)
//   ),
// });

// export const verifyToken = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) return res.status(401).json({ error: "No token" });

//   try {
//     const decoded = await admin.auth().verifyIdToken(token);
//     req.uid = decoded.uid;
//     next();
//   } catch {
//     res.status(401).json({ error: "Invalid token" });
//   }
// };
