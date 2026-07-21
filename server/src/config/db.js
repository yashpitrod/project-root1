import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI environment variable is not set");
    process.exit(1);
  }

  try {
    cachedConnection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      retryWrites: true,
      autoIndex: true,
    });

    console.log("✅ MongoDB connected");

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
      cachedConnection = null;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    return cachedConnection;
  } catch (error) {
    console.error("❌ MongoDB connection failed");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
