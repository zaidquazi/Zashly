import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY || process.env.STEAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET || process.env.STEAM_API_SECRET;

console.log("🔧 Stream Config:", { 
  apiKey: apiKey ? `${apiKey.slice(0, 6)}...` : 'MISSING', 
  apiSecret: apiSecret ? `${apiSecret.slice(0, 6)}...` : 'MISSING' 
});

let streamClient = null;
if (apiKey && apiSecret) {
  try {
    streamClient = StreamChat.getInstance(apiKey, apiSecret);
    console.log("✅ Stream Chat client initialized successfully");
  } catch (e) {
    console.error("❌ Stream Chat init failed:", e.message);
  }
} else {
  console.warn("⚠️  Stream API key or secret missing – chat features disabled");
}

export const upsertStreamUser = async (userData) => {
  if (!streamClient) return userData;
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
  return userData;
};

export const generateStreamToken = (userId) => {
  if (!streamClient) {
    console.error("❌ Cannot generate token: Stream client not initialized");
    return null;
  }
  try {
    const userIdStr = userId.toString();
    const token = streamClient.createToken(userIdStr);
    console.log(`✅ Generated Stream token for user: ${userIdStr}`);
    return token;
  } catch (error) {
    console.error("❌ Error generating Stream token:", error);
  }
  return null;
};
