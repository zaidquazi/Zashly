import "./src/load-env.js";
import { connectDB } from "./src/lib/db.js";
import mongoose from "mongoose";
import User from "./src/models/User.js";

async function resetPassword() {
  try {
    await connectDB();
    const users = await User.find({ email: { $regex: /zaid/i } });

    if (users.length === 0) {
      console.log("❌ No user found containing 'zaid' in the database at all!");
      console.log("Here are the actual emails stored in the database:");
      const allUsers = await User.find({}, "email");
      allUsers.forEach(u => console.log(`- ${u.email}`));
      return;
    }

    for (const user of users) {
      user.email = "zaidquazi412@gmail.com";
      user.password = "zaid890";
      await user.save(); // This triggers the hashing automatically
      console.log("✅ Email and Password successfully reset!");
      console.log("New Email: " + user.email);
      console.log("New Password: zaid890");
    }
  } catch (e) {
    console.error("Error:", e);
  } finally {
    mongoose.disconnect();
  }
}

resetPassword();
