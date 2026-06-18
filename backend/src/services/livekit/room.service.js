import { RoomServiceClient } from "livekit-server-sdk";
import { validateEnv } from "../../config/security/env.config.js";
import { getLiveKitUrl } from "./token.service.js";

const env = validateEnv();

const MAX_PARTICIPANTS = 50;

function getRoomClient() {
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;
  const host = getLiveKitUrl();
  if (!apiKey || !apiSecret) {
    throw new Error("LiveKit is not configured");
  }
  return new RoomServiceClient(host, apiKey, apiSecret);
}

/**
 * Create or ensure a LiveKit room exists with capacity for group calls.
 */
export async function createLiveKitRoom(roomName) {
  const client = getRoomClient();
  try {
    await client.createRoom({
      name: roomName,
      emptyTimeout: 300,
      maxParticipants: MAX_PARTICIPANTS,
    });
  } catch (err) {
    // Room may already exist from a concurrent request — safe to continue
    if (!err?.message?.includes("already exists")) {
      throw err;
    }
  }
  return { roomName, maxParticipants: MAX_PARTICIPANTS };
}

export async function deleteLiveKitRoom(roomName) {
  const client = getRoomClient();
  try {
    await client.deleteRoom(roomName);
  } catch {
    // Room may already be empty/deleted
  }
}

export async function removeParticipant(roomName, identity) {
  const client = getRoomClient();
  await client.removeParticipant(roomName, String(identity));
}

export async function listRoomParticipants(roomName) {
  const client = getRoomClient();
  const participants = await client.listParticipants(roomName);
  return participants;
}
