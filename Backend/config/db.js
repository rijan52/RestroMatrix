import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

// Load .env variables
dotenv.config();

const configuredDnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

try {
  dns.setServers(configuredDnsServers);
  console.log("Using DNS servers:", configuredDnsServers.join(", "));
} catch (error) {
  console.error("Failed to set custom DNS servers:", error.message);
}

export const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URL;
  const fallbackUri = process.env.MONGODB_URL_FALLBACK;

  if (!primaryUri) {
    console.error("MONGODB_URL is missing in environment variables");
    return;
  }

  try {
    await mongoose.connect(primaryUri, {
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
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);

    const isSrvDnsError =
      String(error.message).includes("querySrv") ||
      String(error.message).includes("ENOTFOUND") ||
      String(error.message).includes("ECONNREFUSED");

    if (isSrvDnsError && fallbackUri) {
      try {
        console.log("Trying fallback MongoDB URI (non-SRV)...");
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          maxPoolSize: 10,
          minPoolSize: 2,
          waitQueueTimeoutMS: 10000,
        });
        console.log("Connected to MongoDB via fallback URI");
        return;
      } catch (fallbackError) {
        console.error("Fallback MongoDB connection failed:", fallbackError.message);
      }
    }

    console.error("MONGODB_URL:", primaryUri ? "Configured" : "Missing");
    console.error("MONGODB_URL_FALLBACK:", fallbackUri ? "Configured" : "Missing");

    // Retry after 5 seconds
    console.log("Retrying connection in 5 seconds...");
    setTimeout(() => connectDB(), 5000);
  }
};
