/**
 * Resolve client IP behind reverse proxy (NGINX, Cloudflare) when TRUST_PROXY=true.
 */
export function getClientIp(req) {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function getUserAgent(req) {
  return req.headers["user-agent"]?.substring(0, 512) || "unknown";
}
