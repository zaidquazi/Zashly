import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import useAuthUser from "./useAuthUser";

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:5002";

let socketInstance = null;

const socketStateSetters = new Set();

function notifyAll(value) {
  socketStateSetters.forEach((setter) => setter(value));
}

const useSocket = () => {
  const { authUser } = useAuthUser();
  const [socket, setSocket] = useState(socketInstance);
  const [isConnected, setIsConnected] = useState(
    () => socketInstance?.connected ?? false
  );
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    socketStateSetters.add(setSocket);
    return () => {
      socketStateSetters.delete(setSocket);
    };
  }, []);

  useEffect(() => {
    if (!authUser?._id) {
      // User logged out â€” tear down
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
        notifyAll(null);
        setIsConnected(false);
      }
      return;
    }

    if (socketInstance) {
      setSocket(socketInstance);
      if (socketInstance.connected) {
        setIsConnected(true);
        socketInstance.emit("user-online", authUser._id);
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 20,
    });

    socketInstance = newSocket;
    notifyAll(newSocket); // tell every hook instance
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      newSocket.emit("user-online", authUser._id);
    });

    newSocket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (import.meta.env.DEV) {
        console.warn("Socket disconnected:", reason);
      }
    });

    newSocket.on("connect_error", (error) => {
      reconnectAttempts.current += 1;
      if (import.meta.env.DEV) {
        console.error(
          `Socket connect error (attempt ${reconnectAttempts.current}):`,
          error.message
        );
      }
    });

    return () => {};
  }, [authUser?._id]);

  const emit = useCallback((event, data) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
    }
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
