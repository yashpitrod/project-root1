import express from "express";
import cors from "cors";
import helmet from "helmet"; // EX-01: Security headers
import rateLimit from "express-rate-limit"; // EX-02: Rate limiting
import morgan from "morgan"; // EX-04: Request logging
import compression from "compression"; // EX-05: Payload compression

import authRoutes from "./routes/authRoutes.js";
import translateRoutes from "./routes/translateRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

const app = express();

// EX-01: Helmet — sets security headers (CSP, HSTS, X-Frame-Options, hides X-Powered-By)
// Disabling CSP since this is a pure JSON API and serves no HTML
app.use(helmet({ contentSecurityPolicy: false }));

// Centralized CORS origins — used by both Express and Socket.IO
export const allowedOrigins = [
  "http://localhost:5173",
  "https://campus-care-gules.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log(`Allowed CORS origins: ${allowedOrigins.join(", ")}`);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// EX-05: Compression — compress response bodies
app.use(compression());

// EX-04: Morgan — request logging (using "dev" format, switch to "combined" for production if preferred)
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(express.json());

// EX-02: Global rate limiter — 300 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// EX-02: Stricter rate limiter for expensive Gemini API translation route
const translateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10,             // 10 translation requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Translation rate limit exceeded. Please wait a moment." },
});
app.use("/api/translate", translateLimiter);

// EX-06: Health check endpoint for uptime monitoring/deployment
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/translate", translateRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/doctors", doctorRoutes);

// EX-03: Global error handler — must be after all routes (4-arg signature)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack || err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error",
  });
});

export default app;
