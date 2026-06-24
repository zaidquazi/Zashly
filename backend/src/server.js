import "./load-env.js";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer } from "http";

import { validateEnv } from "./config/security/env.config.js";
import { getCorsOptions } from "./config/security/cors.config.js";
import {
  helmetMiddleware,
  mongoSanitizeMiddleware,
  hppMiddleware,
  compressionMiddleware,
} from "./middleware/security/securityStack.middleware.js";
import { httpsRedirectMiddleware } from "./middleware/security/httpsRedirect.middleware.js";
import { globalApiLimiter } from "./middleware/security/rateLimit.middleware.js";
import { requestLoggerMiddleware } from "./middleware/security/requestLogger.middleware.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middleware/security/errorHandler.middleware.js";
import logger from "./monitoring/logger.js";

const env = validateEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import momentRoutes from "./routes/moment.route.js";
import groupRoutes from "./routes/group.route.js";
import adminRoutes from "./routes/admin.route.js";
import notificationRoutes from "./routes/notification.route.js";
import usernameRoutes from "./routes/username.route.js";
import callRoutes from "./routes/call.route.js";
import publicRoutes from "./routes/public.route.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import { seedReservedUsernames } from "./services/username.service.js";

if (env.TRUST_PROXY === "true") {
  // Required for rate limiting + secure cookies behind NGINX / Cloudflare
}

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { message: err.message, stack: err.stack });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
});

const app = express();
const PORT = env.PORT || 5002;

// ─── Security middleware (order matters) ─────────────────────────────
app.use(httpsRedirectMiddleware);
app.use(helmetMiddleware);
app.use(compressionMiddleware);
app.use(requestLoggerMiddleware);
app.use(globalApiLimiter);

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(mongoSanitizeMiddleware);
app.use(hppMiddleware);

// ─── API routes ────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/moments", momentRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/usernames", usernameRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/public", publicRoutes);

// Static uploads — only serve from isolated directory (no directory listing)
app.use(
  "/uploads",
  express.static(uploadDir, {
    dotfiles: "deny",
    index: false,
    maxAge: env.isProduction ? "7d" : 0,
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "public, max-age=604800");
    },
  })
);

app.get("/healthcheck", async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  const memory = process.memoryUsage();
  res.json({
    status: dbStatus === "connected" ? "ok" : "error",
    database: dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
    },
    timestamp: new Date().toISOString()
  });
});

if (env.isProduction) {
  const frontendDist = path.join(__dirname, "../frontend/dist");
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

const server = createServer(app);

if (env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

initSocket(server);

async function start() {
  try {
    await connectDB();
    await seedReservedUsernames();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(PORT, () => {
        server.off("error", reject);
        resolve();
      });
    });
    logger.info(`Server is running on port ${PORT}`);
  } catch (err) {
    logger.error("Server failed to start", { message: err?.message || err });
    process.exit(1);
  }
}

start();