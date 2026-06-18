/**
 * Core HTTP security stack — Helmet headers, NoSQL injection sanitization, HPP protection.
 * Apply once at app bootstrap before routes.
 */
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import compression from "compression";
import { validateEnv } from "../../config/security/env.config.js";

const env = validateEnv();

/** Helmet — XSS filter, clickjacking, MIME sniffing, HSTS in production */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:"],
          fontSrc: ["'self'", "https:", "data:"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: env.isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

/** Strips $ and . from user input — blocks {$gt: ""} Mongo operator injection */
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    if (env.isDevelopment) {
      console.warn(`[mongo-sanitize] Sanitized key "${key}" on ${req.method} ${req.path}`);
    }
  },
});

/** HTTP Parameter Pollution — duplicate query keys cannot override auth checks */
export const hppMiddleware = hpp({
  whitelist: ["page", "limit", "sort", "q", "status"],
});

/** Gzip responses — reduces bandwidth without weakening security */
export const compressionMiddleware = compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
});
