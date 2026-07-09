import mongoose from "mongoose";

const connectDB = async () => {
  // DB-01: Guard against missing MONGO_URI before attempting connection
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI environment variable is not set");
    process.exit(1);
  }

  try {
    // DB-02: Add timeout options so queries fail fast instead of hanging if the DB goes down
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected");

    // DB-03: Add event listeners for dropped connections
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
