/**
 * Strict CORS — never use origin: "*" with credentials.
 * Production: set CLIENT_URLS=https://app.example.com,https://www.example.com
 */
import { validateEnv } from "./env.config.js";

export function getCorsOptions() {
  const env = validateEnv();

  const defaults = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://localtest.me:5173",
  ];

  let allowedOrigins = [...defaults];

  if (env.CLIENT_URL) {
    allowedOrigins.push(env.CLIENT_URL);
  }
  if (env.CLIENT_URLS) {
    allowedOrigins.push(
      ...env.CLIENT_URLS.split(",").map((o) => o.trim()).filter(Boolean)
    );
  }
  if (process.env.FRONTEND_ORIGIN) {
    allowedOrigins.push(process.env.FRONTEND_ORIGIN.trim());
  }

  allowedOrigins = [...new Set(allowedOrigins)];

  return {
    origin(origin, callback) {
      // Same-origin / server-to-server / mobile apps may omit Origin
      if (!origin) {
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-refresh-token"],
    exposedHeaders: ["RateLimit-Limit", "RateLimit-Remaining", "RateLimit-Reset"],
    maxAge: 86400,
  };
}

export function getSocketCorsOrigins() {
  const env = validateEnv();
  const defaults = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://localtest.me:5173",
  ];
  let origins = [...defaults];
  if (env.CLIENT_URL) origins.push(env.CLIENT_URL);
  if (env.CLIENT_URLS) {
    origins.push(
      ...env.CLIENT_URLS.split(",").map((o) => o.trim()).filter(Boolean)
    );
  }
  if (process.env.FRONTEND_ORIGIN) {
    origins.push(process.env.FRONTEND_ORIGIN.trim());
  }
  return [...new Set(origins)];
}
