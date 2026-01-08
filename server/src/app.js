import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import translateRoutes from "./routes/translateRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT","PATCH", "DELETE"],
    credentials: true
}));

app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://project-root1.vercel.app"
  ],
  credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/translate", translateRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/doctors", doctorRoutes);

export default app;
