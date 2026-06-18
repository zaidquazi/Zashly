/**
 * Centralized error handler — never leak stack traces, DB errors, or paths in production.
 */
import logger from "../../monitoring/logger.js";
import { validateEnv } from "../../config/security/env.config.js";

const env = validateEnv();

export function notFoundHandler(req, res) {
  res.status(404).json({ message: "Resource not found" });
}

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  logger.error("Request error", {
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    ...(env.isDevelopment && { stack: err.stack }),
  });

  // Mongoose validation / cast errors — safe messages only
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid data provided" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier" });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry" });
  }

  const clientMessage =
    isServerError && env.isProduction
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  res.status(statusCode).json({
    message: clientMessage,
    ...(env.isDevelopment && { stack: err.stack }),
  });
}
