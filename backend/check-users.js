import "./src/load-env.js";
import { connectDB } from "./src/lib/db.js";
import mongoose from "mongoose";
import User from "./src/models/User.js";

async function check() {
  try {
    await connectDB();
    const users = await User.find({}, "email fullName role");
    console.log("--- Registered Users & Roles ---");
    users.forEach((u, idx) => {
      console.log(`${idx + 1}. Name: ${u.fullName} | Email: ${u.email} | Role: ${u.role}`);
    });
  } catch (e) {
    console.error("Error:", e);
  } finally {
    mongoose.disconnect();
  }
}

check();
