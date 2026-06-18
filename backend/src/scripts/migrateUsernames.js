import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import User from "../models/User.js";
import UsernameRegistry from "../models/UsernameRegistry.js";

async function migrate() {
  try {
    console.log("Connecting to MongoDB...", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      if (!user.username) continue;

      const usernameLowerCase = user.username.toLowerCase();

      // Ensure user has usernameLowerCase set if we didn't have it before
      if (!user.usernameLowerCase) {
        user.usernameLowerCase = usernameLowerCase;
        await user.save();
      }

      // Upsert into registry
      await UsernameRegistry.findOneAndUpdate(
        { usernameLowerCase },
        {
          $setOnInsert: {
            username: user.username,
            usernameLowerCase,
            ownerId: user._id,
            status: "active",
            ownershipStartedAt: user.createdAt,
            isProtected: user.isVerified || false,
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
