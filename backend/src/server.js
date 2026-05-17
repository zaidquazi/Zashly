import "./load-env.js";

import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import momentRoutes from "./routes/moment.route.js";
import groupRoutes from "./routes/group.route.js";
import adminRoutes from "./routes/admin.route.js";
import callRoutes from "./routes/call.route.js";
import notificationRoutes from "./routes/notification.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, p) => {
  console.error("Unhandled Rejection at:", p, "reason:", reason);
});

const app = express();
const PORT = process.env.PORT || 5002;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/moments", momentRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/notifications", notificationRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.get("/healthcheck", (req, res) => {
  res.send("backend working");
});

const server = createServer(app);
initSocket(server);

function listenAsync(httpServer, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      httpServer.off("error", onError);
      reject(err);
    };
    httpServer.once("error", onError);
    httpServer.listen(port, () => {
      httpServer.off("error", onError);
      resolve();
    });
  });
}

function killProcessOnPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf-8",
    });
    const lines = result.trim().split("\n");
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0" && !isNaN(pid)) {
        pids.add(pid);
      }
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { encoding: "utf-8" });
        console.log(`🔪 Killed process ${pid} that was using port ${port}`);
      } catch {
      }
    }
    return pids.size > 0;
  } catch {
    return false;
  }
}

async function start(retried = false) {
  try {
    await connectDB();
    await listenAsync(server, PORT);
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    if (err?.code === "EADDRINUSE" && !retried) {
      console.warn(
        `\n⚠️  Port ${PORT} is busy — auto-killing the old process…`
      );
      const killed = killProcessOnPort(PORT);
      if (killed) {
        await new Promise((r) => setTimeout(r, 1000));
        return start(true); // retry once
      }
    }
    console.error("\n❌ Server failed to start:");
    if (err?.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is still in use after auto-kill attempt.`
      );
      console.error(
        `Manually run:  netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`
      );
    } else {
      console.error(err?.message || err);
      console.error(
        "\nTip: Ensure MongoDB is running and MONGO_URI in backend/.env is correct."
      );
    }
    process.exit(1);
  }
}

start();
