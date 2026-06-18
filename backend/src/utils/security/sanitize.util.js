/**
 * Input/output sanitization — XSS, HTML injection, malicious links in chat content.
 */
import xss from "xss";
import validator from "validator";

const xssFilter = new xss.FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
});

/** Strip HTML/scripts from user text (messages, bios, names) */
export function sanitizeText(input, maxLength = 5000) {
  if (input == null) return "";
  let str = String(input).trim();
  if (str.length > maxLength) {
    str = str.slice(0, maxLength);
  }
  str = xssFilter.process(str);
  return validator.escape(str);
}

/** Unescape for display only after server-side storage — prefer sending sanitized text to clients */
export function sanitizePlainText(input, maxLength = 2000) {
  if (input == null) return "";
  const str = String(input).trim().slice(0, maxLength);
  return validator.stripLow(str, true);
}

/** Block javascript: and data: URLs in user-provided links */
export function sanitizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!validator.isURL(trimmed, { protocols: ["http", "https"], require_protocol: true })) {
    return "";
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return "";
  }
  return trimmed;
}

/** Deep-sanitize object string fields for API responses (optional layer) */
export function sanitizeObjectStrings(obj, depth = 0) {
  if (depth > 5 || obj == null) return obj;
  if (typeof obj === "string") return sanitizePlainText(obj);
  if (Array.isArray(obj)) return obj.map((v) => sanitizeObjectStrings(v, depth + 1));
  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "password" || k.endsWith("Token") || k === "resetToken") continue;
      out[k] = sanitizeObjectStrings(v, depth + 1);
    }
    return out;
  }
  return obj;
}
