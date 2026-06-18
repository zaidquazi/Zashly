import { AccessToken } from "livekit-server-sdk";
import { validateEnv } from "../../config/security/env.config.js";

const env = validateEnv();

function getLiveKitCredentials() {
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit is not configured");
  }
  return { apiKey, apiSecret };
}

/**
 * Generate a LiveKit access token for a participant.
 * Tokens are always issued server-side — never expose API secrets to clients.
 */
export async function generateLiveKitToken({
  identity,
  name,
  roomName,
  canPublish = true,
  canSubscribe = true,
  canPublishData = true,
  isHost = false,
}) {
  const { apiKey, apiSecret } = getLiveKitCredentials();

  const at = new AccessToken(apiKey, apiSecret, {
    identity: String(identity),
    name: name || String(identity),
    ttl: "2h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe,
    canPublishData,
    roomAdmin: isHost,
    roomCreate: isHost,
  });

  return at.toJwt();
}

export function getLiveKitUrl() {
  const url = env.LIVEKIT_URL;
  if (!url) {
    throw new Error("LIVEKIT_URL is not configured");
  }
  return url;
}

export function isLiveKitConfigured() {
  return Boolean(env.LIVEKIT_API_KEY && env.LIVEKIT_API_SECRET && env.LIVEKIT_URL);
}
