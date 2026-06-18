/**
 * Morgan HTTP request logging — combined with Winston for audit trail.
 */
import morgan from "morgan";
import logger from "../../monitoring/logger.js";

const stream = {
  write: (message) => logger.http(message.trim()),
};

export const requestLoggerMiddleware = morgan(
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
  { stream, skip: (req) => req.path === "/healthcheck" }
);
