import mongoose from "mongoose";

 export const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://restromatrix:restromatrix@restromatrix-cluster.dqraib5.mongodb.net/?appName=restromatrix-cluster");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

