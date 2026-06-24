import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const MONGO_URI = "mongodb+srv://zamakhan392_db_user:DtXkQ1XX5tLaxhuG@cluster0.ssuulkx.mongodb.net/Zashly_db?retryWrites=true&w=majority&appName=Cluster0";
const JWT_SECRET = "super_secret_jwt_key_that_is_at_least_32_characters_long_for_zashly";

mongoose.connect(MONGO_URI).then(async () => {
  const users = await mongoose.connection.db.collection("users").find({}).limit(2).toArray();
  const userA = users[0];
  const userB = users[1];

  const tokenA = jwt.sign({ userId: userA._id.toString(), tokenVersion: userA.tokenVersion || 0 }, JWT_SECRET, { expiresIn: "7d" });
  const tokenB = jwt.sign({ userId: userB._id.toString(), tokenVersion: userB.tokenVersion || 0 }, JWT_SECRET, { expiresIn: "7d" });

  console.log("User A ID:", userA._id.toString());
  console.log("User A Token:", tokenA);
  console.log("User B ID:", userB._id.toString());
  console.log("User B Token:", tokenB);

  process.exit(0);
});
