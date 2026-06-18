/**
 * End-to-end socket call signaling smoke test (two users).
 * Usage: node test-call-signaling.cjs
 * Requires backend running on PORT (default 5002).
 */
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const { io } = require("socket.io-client");

const BASE = process.env.API_BASE || "http://localhost:5002";
const SOCKET_URL = BASE;

async function loginClient(username, password) {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar, withCredentials: true, baseURL: `${BASE}/api` }));
  const res = await client.post("/auth/login", { username, password });
  if (!res.data?.success && !res.data?.user) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  const cookies = await jar.getCookies(BASE);
  const jwt = cookies.find((c) => c.key === "jwt")?.value;
  if (!jwt) throw new Error(`No jwt cookie after login for ${username}`);
  const userId = res.data.user?._id || res.data.user?.id;
  return { jar, client, jwt, userId: String(userId), name: res.data.user?.fullName || username };
}

function connectSocket(jwt) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      extraHeaders: { Cookie: `jwt=${jwt}` },
      transports: ["websocket"],
    });
    const t = setTimeout(() => reject(new Error("Socket connect timeout")), 12000);
    socket.on("connect", () => {
      clearTimeout(t);
      resolve(socket);
    });
    socket.on("connect_error", (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

async function main() {
  const userA = process.env.CALL_TEST_USER_A || "zashlytester";
  const passA = process.env.CALL_TEST_PASS_A || "Password123!";
  const userB = process.env.CALL_TEST_USER_B;
  const passB = process.env.CALL_TEST_PASS_B;

  console.log("Logging in caller:", userA);
  const caller = await loginClient(userA, passA);

  let callee;
  if (userB && passB) {
    console.log("Logging in callee:", userB);
    callee = await loginClient(userB, passB);
  } else {
    console.log("CALL_TEST_USER_B not set — fetching friends for callee");
    const friendsRes = await caller.client.get("/users/friends");
    const friends = friendsRes.data || [];
    if (!friends.length) {
      throw new Error("Caller has no friends; set CALL_TEST_USER_B and CALL_TEST_PASS_B");
    }
    const friend = friends[0];
    console.log("Callee will be friend:", friend.fullName, friend._id);
    callee = { userId: String(friend._id), name: friend.fullName, jwt: null, jar: null };
    console.warn("Skipping callee socket — need second account credentials for full test");
    process.exit(0);
  }

  const callerSocket = await connectSocket(caller.jwt);
  const calleeSocket = await connectSocket(callee.jwt);

  callerSocket.emit("user-online", caller.userId);
  calleeSocket.emit("user-online", callee.userId);
  await new Promise((r) => setTimeout(r, 500));

  const callId = `test_${caller.userId}_${callee.userId}_${Date.now()}`;

  const incomingPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("callee did not receive call:incoming within 5s")), 5000);
    calleeSocket.once("call:incoming", (data) => {
      clearTimeout(t);
      resolve(data);
    });
  });

  const ackPromise = new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("caller ack timeout")), 5000);
    callerSocket.emit(
      "call:initiate",
      {
        callId,
        callerId: caller.userId,
        callerName: caller.name,
        callerPic: "",
        targetId: callee.userId,
        type: "one-on-one",
        callType: "voice",
      },
      (ack) => {
        clearTimeout(t);
        resolve(ack);
      }
    );
  });

  const [ack, incoming] = await Promise.all([ackPromise, incomingPromise]);

  console.log("ACK:", ack);
  console.log("INCOMING:", incoming);

  if (!ack?.success) throw new Error(`call:initiate failed: ${ack?.error}`);
  if (incoming?.callId !== callId) throw new Error("callId mismatch on incoming");

  console.log("PASS: call:incoming delivered to callee");

  callerSocket.emit("call:end", { callId, userId: caller.userId });
  callerSocket.disconnect();
  calleeSocket.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
