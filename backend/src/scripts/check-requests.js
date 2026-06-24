import "./src/load-env.js";
import { connectDB } from "./src/lib/db.js";
import mongoose from "mongoose";
import PasswordResetRequest from "./src/models/PasswordResetRequest.js";
import User from "./src/models/User.js";

async function check() {
  try {
    await connectDB();
    const requests = await PasswordResetRequest.find().populate("user", "email fullName");
    console.log("--- Password Reset Requests ---");
    console.log(`Total Requests: ${requests.length}`);
    requests.forEach((r, idx) => {
      console.log(`${idx + 1}. User: ${r.user?.email || "Unknown"} | Status: ${r.status} | CreatedAt: ${r.createdAt}`);
    });
  } catch (e) {
    console.error("Error:", e);
  } finally {
    mongoose.disconnect();
  }
}

check();
