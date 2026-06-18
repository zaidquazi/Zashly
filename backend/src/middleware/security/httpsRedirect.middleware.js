/**
 * Production HTTPS enforcement — redirect HTTP to HTTPS behind reverse proxy.
 * Set TRUST_PROXY=true when behind NGINX / Cloudflare / load balancer.
 */
import { validateEnv } from "../../config/security/env.config.js";

const env = validateEnv();

export function httpsRedirectMiddleware(req, res, next) {
  if (!env.isProduction) {
    return next();
  }

  const proto = req.headers["x-forwarded-proto"];
  if (proto === "https" || req.secure) {
    return next();
  }

  const host = req.headers.host || req.hostname;
  return res.redirect(301, `https://${host}${req.originalUrl}`);
}
