import mongoose from "mongoose";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

export const connectDB = async () => {
  try {
    // Use environment variable
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
