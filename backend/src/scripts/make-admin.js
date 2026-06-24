import "./src/load-env.js";
import { connectDB } from "./src/lib/db.js";
import mongoose from "mongoose";
import User from "./src/models/User.js";

async function makeAdmin() {
  try {
    await connectDB();
    const result = await User.updateMany(
      { email: { $regex: /zaid/i } },
      { $set: { role: "admin" } }
    );
    
    if (result.matchedCount === 0) {
      console.log("❌ No users found with 'zaid' in their email!");
      const allUsers = await User.find({}, "email");
      console.log("Here are the actual emails in your database:");
      allUsers.forEach(u => console.log(`- ${u.email}`));
    } else {
      console.log(`✅ Success! Upgraded ${result.modifiedCount} user(s) to admin.`);
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    mongoose.disconnect();
  }
}

makeAdmin();
