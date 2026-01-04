import dotenv from "dotenv";
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});

import http from "http";
import { Server } from "socket.io";

import connectDB from "./src/config/db.js";
import app from "./src/app.js";

connectDB();

const PORT = process.env.PORT || 5000;

/* 🔌 Create HTTP server from Express */
const server = http.createServer(app);

/* 🔴 Attach Socket.IO */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH","DELETE"],
  },
});

/* 🔗 SOCKET CONNECTION */
io.on("connection", (socket) => {

  socket.on("join-room", (userId) => {
    socket.join(userId);
  });
});

/* 🌍 Make io accessible inside routes */
app.set("io", io);

/* 🚀 Start server */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
