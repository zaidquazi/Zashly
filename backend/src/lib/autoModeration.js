import logger from "../monitoring/logger.js";
import BannedWord from "../models/BannedWord.js";

// In-memory cache for banned words to avoid DB hits on every message
let bannedWordsCache = [];
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

async function loadCache() {
  const now = Date.now();
  if (now - cacheLoadedAt < CACHE_TTL_MS && bannedWordsCache.length > 0) return;

  try {
    bannedWordsCache = await BannedWord.find({ isActive: true }).lean();
    cacheLoadedAt = now;
  } catch (err) {
    logger.error("Failed to load banned words cache:", err.message);
  }
}

/**
 * Checks a message against the banned words list.
 * @returns {{ flagged: boolean, matches: Array, censored: string, action: string }}
 */
export async function checkMessage(text) {
  if (!text || typeof text !== "string") {
    return { flagged: false, matches: [], censored: text, action: null };
  }

  await loadCache();

  const lowerText = text.toLowerCase();
  const matches = [];
  let highestAction = null;
  const actionPriority = { censor: 1, block: 2, strike: 3 };

  for (const entry of bannedWordsCache) {
    // Word-boundary match to avoid false positives inside other words
    const regex = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, "gi");
    if (regex.test(lowerText)) {
      matches.push({
        word: entry.word,
        severity: entry.severity,
        action: entry.action,
      });

      if (
        !highestAction ||
        actionPriority[entry.action] > actionPriority[highestAction]
      ) {
        highestAction = entry.action;
      }
    }
  }

  if (matches.length === 0) {
    return { flagged: false, matches: [], censored: text, action: null };
  }

  // Build censored version of the text
  let censored = text;
  for (const m of matches) {
    const regex = new RegExp(`\\b${escapeRegex(m.word)}\\b`, "gi");
    censored = censored.replace(regex, (match) => "*".repeat(match.length));
  }

  return { flagged: true, matches, censored, action: highestAction };
}

/**
 * Force-reload the banned words cache (call after CRUD ops on BannedWord)
 */
export function invalidateCache() {
  cacheLoadedAt = 0;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
