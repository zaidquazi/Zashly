/**
 * Winston structured logging — security events, errors, and request audit trail.
 * Never log passwords, tokens, or full request bodies with secrets.
 */
import winston from "winston";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, "../../../logs");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "zashly-api" },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5_242_880,
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "security.log"),
      level: "warn",
      maxsize: 5_242_880,
      maxFiles: 10,
    }),
  ],
});

if (!isProduction) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

/** Log authentication / authorization security events */
export function logSecurityEvent(event, meta = {}) {
  logger.warn("SECURITY_EVENT", { event, ...meta, timestamp: new Date().toISOString() });
}

export function logFailedLogin(email, ip, reason) {
  logSecurityEvent("FAILED_LOGIN", { email: email?.substring(0, 3) + "***", ip, reason });
}

export function logAccountLock(email, ip) {
  logSecurityEvent("ACCOUNT_LOCKED", { email: email?.substring(0, 3) + "***", ip });
}

export default logger;
