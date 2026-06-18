/**
 * File upload security — block executables, path traversal, and spoofed MIME types.
 */
import path from "path";
import crypto from "crypto";

/** Blocked extensions (executables, scripts, server-side code) */
export const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".msi",
  ".sh", ".bash", ".ps1",
  ".php", ".phtml", ".php3", ".php4", ".php5",
  ".js", ".mjs", ".cjs", ".jar",
  ".html", ".htm", ".svg",
  ".dll", ".scr", ".vbs",
]);

/** Allowed MIME types for moments / profile media */
export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB decoded
const MAX_VIDEO_BYTES = 55 * 1024 * 1024; // 55 MB

/**
 * Validate base64 data URL upload from client.
 * @returns {{ ok: boolean, error?: string, mimeType?: string, ext?: string, buffer?: Buffer }}
 */
export function validateBase64Upload(dataUrl, type) {
  if (!dataUrl || typeof dataUrl !== "string") {
    return { ok: false, error: "Invalid upload payload" };
  }

  if (dataUrl.length > 80_000_000) {
    return { ok: false, error: "Payload too large" };
  }

  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!match) {
    return { ok: false, error: "Invalid data URL format" };
  }

  let mimeType = match[1].toLowerCase();
  if (mimeType.includes(";")) mimeType = mimeType.split(";")[0];

  const allowed =
    type === "video" ? ALLOWED_VIDEO_MIMES : ALLOWED_IMAGE_MIMES;
  if (!allowed.has(mimeType)) {
    return { ok: false, error: `File type not allowed: ${mimeType}` };
  }

  const ext = MIME_TO_EXT[mimeType];
  if (!ext) {
    return { ok: false, error: "Unsupported MIME type" };
  }

  if (BLOCKED_EXTENSIONS.has(`.${ext}`)) {
    return { ok: false, error: "Blocked file extension" };
  }

  let buffer;
  try {
    buffer = Buffer.from(match[2], "base64");
  } catch {
    return { ok: false, error: "Invalid base64 data" };
  }

  const maxBytes = type === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (buffer.length > maxBytes) {
    return { ok: false, error: `File exceeds maximum size (${maxBytes / 1024 / 1024}MB)` };
  }

  // Magic-byte sniffing (basic malware / spoof protection)
  if (!matchesMagicBytes(buffer, mimeType)) {
    return { ok: false, error: "File content does not match declared type" };
  }

  return { ok: true, mimeType, ext, buffer };
}

function matchesMagicBytes(buffer, mimeType) {
  if (buffer.length < 4) return false;
  const h = buffer.subarray(0, 12);
  switch (mimeType) {
    case "image/jpeg":
      return h[0] === 0xff && h[1] === 0xd8;
    case "image/png":
      return h[0] === 0x89 && h[1] === 0x50 && h[2] === 0x4e && h[3] === 0x47;
    case "image/gif":
      return buffer.toString("ascii", 0, 6) === "GIF87a" || buffer.toString("ascii", 0, 6) === "GIF89a";
    case "image/webp":
      return buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
    case "video/mp4":
    case "video/quicktime":
      return buffer.toString("ascii", 4, 8) === "ftyp" || buffer.toString("ascii", 0, 4) === "ftyp";
    case "video/webm":
      return h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3;
    default:
      return false;
  }
}

/** Cryptographically random filename — prevents guessing / enumeration */
export function secureFilename(ext) {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 8);
  const id = crypto.randomBytes(16).toString("hex");
  return `moment_${Date.now()}_${id}.${safeExt}`;
}

/** Resolve path inside upload dir only — blocks ../../../etc/passwd */
export function safeUploadPath(uploadDir, filename) {
  const base = path.resolve(uploadDir);
  const resolved = path.resolve(uploadDir, path.basename(filename));
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error("Path traversal detected");
  }
  return resolved;
}
