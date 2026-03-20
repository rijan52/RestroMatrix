import mongoose from "mongoose";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      // Connection timeout: wait up to 30 seconds
      serverSelectionTimeoutMS: 30000,
      // Socket timeout: 45 seconds
      socketTimeoutMS: 45000,
      // Retry writes
      retryWrites: true,
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 2,
      // Wait queue timeout
      waitQueueTimeoutMS: 10000,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    console.error("MONGODB_URL:", process.env.MONGODB_URL ? "Configured" : "Missing");

    // Retry after 5 seconds
    console.log("Retrying connection in 5 seconds...");
    setTimeout(() => connectDB(), 5000);
  }
};
