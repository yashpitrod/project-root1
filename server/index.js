import dotenv from "dotenv";
dotenv.config(); 

import express from "express";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("GEMINI KEY:", process.env.GEMINI_API_KEY);
});
