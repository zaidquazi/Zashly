import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri?.trim()) {
    throw new Error(
      "MONGO_URI is missing. Create backend/.env with MONGO_URI=your_connection_string"
    );
  }
  const conn = await mongoose.connect(uri);
  console.log(`MongoDB Connected: ${conn.connection.host}`);
  
  mongoose.connection.on("error", (err) => {
    console.error("MongoDB Connection Error:", err);
  });
  
  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB Disconnected!");
  });
};
