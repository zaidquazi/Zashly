import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import useAuthUser from "./useAuthUser";
import { refreshSession } from "../lib/api";

const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
let envApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "";

if (envApiUrl.includes("localhost") && currentHost !== "localhost") {
  envApiUrl = envApiUrl.replace("localhost", currentHost);
}

const SOCKET_URL = envApiUrl || `/`;

let socketInstance = null;
let connectionPromise = null;

const socketStateSetters = new Set();
const connectionStateSetters = new Set();

const _onlineRoster = new Set();
const _rosterChangeCallbacks = new Set();
let _rosterReady = false;

function _notifyRosterChange() {
  _rosterChangeCallbacks.forEach((cb) => cb());
}

function _handleGlobalOnlineUsersList(onlineUserIds) {
  if (!Array.isArray(onlineUserIds)) return;
  console.log(`[ROSTER] Received online-users-list:`, onlineUserIds);
  _onlineRoster.clear();
  onlineUserIds.forEach((id) => _onlineRoster.add(String(id)));
  _rosterReady = true;
  _notifyRosterChange();
}



export function isUserOnline(userId) {
  return _onlineRoster.has(String(userId));
}

export function getOnlineUserIds() {
  return new Set(_onlineRoster);
}

export function isRosterReady() {
  return _rosterReady;
}

export function useOnlineRoster() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const cb = () => setTick((t) => t + 1);
    _rosterChangeCallbacks.add(cb);
    return () => _rosterChangeCallbacks.delete(cb);
  }, []);
  return { isUserOnline, getOnlineUserIds, isRosterReady: _rosterReady };
}

function notifyAllSockets(value) {
  socketStateSetters.forEach((setter) => setter(value));
}

function notifyAllConnections(value) {
  connectionStateSetters.forEach((setter) => setter(value));
}

function destroySocket() {
  if (socketInstance) {
    console.log(`[ROSTER] Destroying socket ${socketInstance.id}`);
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    notifyAllSockets(null);
    notifyAllConnections(false);
  }
}

export function getSocketInstance() {
  return socketInstance;
}

const useSocket = () => {
  const { authUser } = useAuthUser();
  const [socket, setSocket] = useState(socketInstance);
  const [isConnected, setIsConnected] = useState(
    () => socketInstance?.connected ?? false
  );
  const connectGenRef = useRef(0);
  const userIdRef = useRef(authUser?._id);

  useEffect(() => {
    socketStateSetters.add(setSocket);
    connectionStateSetters.add(setIsConnected);
    return () => {
      socketStateSetters.delete(setSocket);
      connectionStateSetters.delete(setIsConnected);
    };
  }, []);

  useEffect(() => {
    userIdRef.current = authUser?._id;

    if (!authUser?._id) {
      destroySocket();
      notifyAllConnections(false);
      return;
    }

    const gen = ++connectGenRef.current;
    let cancelled = false;

    const connect = async () => {
      if (socketInstance?.connected) {
        setSocket(socketInstance);
        notifyAllConnections(true);
        socketInstance.emit("user-online", String(authUser._id));
        return;
      }

      if (connectionPromise) {
        try {
          const s = await connectionPromise;
          if (s && !cancelled && gen === connectGenRef.current) {
            setSocket(s);
            setIsConnected(s.connected);
          }
        } catch (err) {
          console.error("[ROSTER] Error awaiting connectionPromise:", err);
        }
        return;
      }

      connectionPromise = (async () => {
        try {
          try {
            await refreshSession();
          } catch (err) {
            console.error("[ROSTER] Failed to refresh session before connect:", err);
          }

          if (cancelled || gen !== connectGenRef.current) {
            return null;
          }

          if (socketInstance?.connected) {
            return socketInstance;
          }

          destroySocket();
          _onlineRoster.clear();
          _rosterReady = false;

          const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 25,
          });

          newSocket.on("online-users-list", _handleGlobalOnlineUsersList);

          newSocket.on("connect", () => {
            console.log(`[ROSTER] Socket connected! ID: ${newSocket.id}, _rosterReady: ${_rosterReady}`);
            notifyAllConnections(true);
            const uid = userIdRef.current;
            if (uid) {
              newSocket.emit("user-online", String(uid));
            }
          });

          newSocket.on("disconnect", () => {
            console.log(`[ROSTER] Socket disconnected! ID: ${newSocket.id}`);
            notifyAllConnections(false);
          });

          newSocket.on("connect_error", async (error) => {
            notifyAllConnections(false);
            const errMsg = error.message?.toLowerCase() || "";
            if (
              !newSocket._authRetried &&
              (errMsg.includes("session") ||
                errMsg.includes("authentication") ||
                errMsg.includes("invalid") ||
                errMsg.includes("expired"))
            ) {
              newSocket._authRetried = true;
              try {
                await refreshSession();
                newSocket.connect();
              } catch (err) {
                console.error("[ROSTER] Failed to refresh session on connect_error:", err);
              }
            }
          });

          socketInstance = newSocket;
          notifyAllSockets(newSocket);

          await new Promise((resolve, reject) => {
            if (newSocket.connected) {
              resolve(newSocket);
              return;
            }
            const onConnect = () => {
              cleanup();
              resolve(newSocket);
            };
            const onConnectError = (err) => {
              cleanup();
              reject(err);
            };
            const cleanup = () => {
              newSocket.off("connect", onConnect);
              newSocket.off("connect_error", onConnectError);
            };
            newSocket.once("connect", onConnect);
            newSocket.once("connect_error", onConnectError);
            
            setTimeout(() => {
              cleanup();
              reject(new Error("Connection timeout"));
            }, 10000);
          });

          return newSocket;
        } finally {
          connectionPromise = null;
        }
      })();

      try {
        const s = await connectionPromise;
        if (s && !cancelled && gen === connectGenRef.current) {
          setSocket(s);
          notifyAllConnections(true);
        }
      } catch (err) {
        console.error("[ROSTER] Final connectionPromise error:", err);
      }
    };

    connect();

    return () => {
      cancelled = true;
    };
  }, [authUser?._id]);

  const emit = useCallback((event, data, ack) => {
    if (socketInstance?.connected) {
      if (typeof ack === "function") {
        socketInstance.timeout(10000).emitWithAck(event, data)
          .then((response) => ack(response))
          .catch(() => ack({ success: false, error: "Server timeout" }));
      } else {
        socketInstance.emit(event, data);
      }
      return true;
    }
    return false;
  }, []);

  const on = useCallback((event, handler) => {
    if (socketInstance) {
      socketInstance.on(event, handler);
      return () => socketInstance?.off(event, handler);
    }
    return () => {};
  }, []);

  const off = useCallback((event, handler) => {
    socketInstance?.off(event, handler);
  }, []);

  return { socket, isConnected, emit, on, off };
};

export default useSocket;
