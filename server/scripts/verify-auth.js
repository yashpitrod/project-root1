import "dotenv/config";
import admin from "../src/config/firebaseAdmin.js";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

const run = async () => {
  try {
    console.log("[1/4] Checking Firebase Admin initialization...");
    console.log("Firebase app initialized:", admin.apps.length > 0);

    console.log("[2/4] Connecting to MongoDB...");
    await connectDB();

    console.log("[3/4] Creating a temporary verification user...");
    const testUid = `verify-${Date.now()}`;
    const testEmail = `verify-${Date.now()}@example.com`;
    const created = await User.findOneAndUpdate(
      { uid: testUid },
      {
        $setOnInsert: {
          uid: testUid,
          email: testEmail,
          name: "Verification User",
          role: "student",
          provider: "firebase",
          emailVerified: true,
          lastLoginAt: new Date(),
          isApproved: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("[4/4] Verifying Mongo user lookup...");
    const found = await User.findOne({ uid: testUid });
    console.log({ created: !!created, found: !!found, email: found?.email });
  } catch (error) {
    console.error("Verification failed:", error.message);
    process.exit(1);
  }
};

run();
