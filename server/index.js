import "dotenv/config";

import http from "http";
import { Server } from "socket.io";
import admin from "./src/config/firebaseAdmin.js";
import User from "./src/models/User.js"; // AU-05: Needed for server-side MongoDB ID lookup

import connectDB from "./src/config/db.js";
import app, { allowedOrigins } from "./src/app.js";
import mongoose from "mongoose";

connectDB();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  transports: ["polling", "websocket"],
  allowUpgrades: true,
});

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // AU-05: Look up the MongoDB user server-side so we know the _id
    // without trusting any client-supplied value
    const mongoUser = await User.findOne({ uid: decoded.uid });
    
    if (!mongoUser) {
      return next(new Error("User not registered in database"));
    }

    socket.user = {
      uid: decoded.uid,
      mongoId: mongoUser._id.toString(),
    };

    next();
  } catch (err) {
    console.error("Socket authentication failed:", err.message);
    next(new Error("Authentication error: Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id, "UID:", socket.user?.uid);

  // AU-05: Auto-join the user's own room using the server-verified MongoDB ID.
  // The client no longer controls which room to join — preventing room injection.
  if (socket.user?.mongoId) {
    socket.join(socket.user.mongoId);
  }

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// EX-08: Graceful shutdown — drain connections before exiting
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false).then(() => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
