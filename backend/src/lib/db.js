import logger from "../monitoring/logger.js";
import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri?.trim()) {
    throw new Error(
      "MONGO_URI is missing. Create backend/.env with MONGO_URI=your_connection_string"
    );
  }

  const conn = await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB Connection Error:", err);
  });
  
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB Disconnected!");
  });
};
