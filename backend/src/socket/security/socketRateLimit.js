/**
 * Per-socket event rate limiting — mitigates spam, flooding, and typing abuse.
 */
const DEFAULT_WINDOW_MS = 10_000;
const DEFAULT_MAX_EVENTS = 40;

export class SocketRateLimiter {
  constructor(windowMs = DEFAULT_WINDOW_MS, maxEvents = DEFAULT_MAX_EVENTS) {
    this.windowMs = windowMs;
    this.maxEvents = maxEvents;
    this.buckets = new Map();
  }

  /** Returns true if allowed, false if rate limited */
  check(socketId, eventName) {
    const key = `${socketId}:${eventName}`;
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket || now - bucket.start > this.windowMs) {
      bucket = { start: now, count: 0 };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > this.maxEvents) {
      return false;
    }
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.start > this.windowMs * 2) {
        this.buckets.delete(key);
      }
    }
  }
}

/** Typing indicators — max 1 burst per 2 seconds per socket */
export class TypingThrottle {
  constructor(cooldownMs = 2000) {
    this.cooldownMs = cooldownMs;
    this.lastEmit = new Map();
  }

  allow(socketId, groupId) {
    const key = `${socketId}:${groupId}`;
    const now = Date.now();
    const last = this.lastEmit.get(key) || 0;
    if (now - last < this.cooldownMs) return false;
    this.lastEmit.set(key, now);
    return true;
  }
}

export const globalSocketLimiter = new SocketRateLimiter(10_000, 50);
export const messageSocketLimiter = new SocketRateLimiter(10_000, 30);
export const typingThrottle = new TypingThrottle(2000);

// Periodic cleanup
setInterval(() => globalSocketLimiter.cleanup(), 60_000);
