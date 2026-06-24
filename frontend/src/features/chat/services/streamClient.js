import { StreamChat } from "stream-chat";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let streamClientInstance = null;
let connectionPromise = null;

export const getStreamClient = () => {
  if (!streamClientInstance && STREAM_API_KEY) {
    streamClientInstance = StreamChat.getInstance(STREAM_API_KEY, {
      timeout: 15000, // Default is 3000ms which causes timeouts on slower connections
    });
  }
  return streamClientInstance;
};

export const connectStreamUser = (authUser, token) => {
  const client = getStreamClient();
  if (!client || !authUser || !token) return Promise.resolve(null);

  const desiredId = String(authUser._id || authUser.id || authUser.userId);

  if (client.userID === desiredId) {
    return Promise.resolve(client);
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      if (client.userID && client.userID !== desiredId) {
        await client.disconnectUser();
      }

      const userImage =
        authUser.profilePic && !authUser.profilePic.startsWith("data:")
          ? authUser.profilePic
          : "";

      if (!client.userID) {
        await client.connectUser(
          { id: desiredId, name: authUser.fullName || authUser.username || "User", image: userImage },
          token
        );
      }
      return client;
    } catch (error) {
      console.error("Error connecting stream user:", error);
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};
