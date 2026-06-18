import "./src/load-env.js";
import { connectDB } from "./src/lib/db.js";
import mongoose from "mongoose";
import User from "./src/models/User.js";

async function setPasswords() {
  try {
    await connectDB();
    const emails = ["zaid@gmail.com", "saad@gmail.com", "zaidquazi412@gmail.com"];
    for (const email of emails) {
      const user = await User.findOne({ email });
      if (user) {
        user.password = "123456";
        await user.save();
        console.log(`Successfully set password of ${email} to '123456'`);
      } else {
        console.log(`User ${email} not found`);
      }
    }
  } catch (e) {
    console.error("Error setting passwords:", e);
  } finally {
    mongoose.disconnect();
  }
}

setPasswords();
