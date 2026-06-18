import UsernameRegistry from "../models/UsernameRegistry.js";
import AuditLog from "../models/AuditLog.js";

const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "support",
  "help",
  "root",
  "owner",
  "official",
  "api",
  "system",
  "team",
  "security",
  "zashly",
  "zashlyofficial",
  "founder",
  "developer",
  "staff"
];

/**
 * Initializes the username registry by permanently blocking reserved usernames.
 * This should be called once on server startup.
 */
export async function seedReservedUsernames() {
  for (const username of RESERVED_USERNAMES) {
    const usernameLowerCase = username.toLowerCase();
    const existing = await UsernameRegistry.findOne({ usernameLowerCase });
    if (!existing) {
      await UsernameRegistry.create({
        username,
        usernameLowerCase,
        status: "blocked",
        isProtected: true,
      });
    }
  }
}

/**
 * Checks if a username is available for registration.
 * @param {string} username - The requested username
 * @returns {object} { available: boolean, status: string, message: string }
 */
export async function checkUsernameAvailability(username) {
  if (!username) return { available: false, status: "invalid", message: "Username is required" };

  const usernameLowerCase = username.toLowerCase();

  const record = await UsernameRegistry.findOne({ usernameLowerCase });

  if (!record) {
    return { available: true, status: "available", message: "Username is available" };
  }

  if (record.status === "active") {
    return { available: false, status: "taken", message: "This username is already taken" };
  }

  if (record.status === "reserved") {
    if (record.reservedUntil && record.reservedUntil > new Date()) {
      return { available: false, status: "reserved", message: "This username is currently reserved" };
    } else {
      // Reservation expired
      return { available: true, status: "released", message: "Username is available" };
    }
  }

  if (record.status === "protected") {
    return { available: false, status: "protected", message: "This username is protected and cannot be claimed" };
  }

  if (record.status === "blocked") {
    return { available: false, status: "blocked", message: "Restricted Username" };
  }

  return { available: true, status: "available", message: "Username is available" };
}

/**
 * Claims a username for a user. Atomic-like validation.
 * @param {string} username - The requested username
 * @param {ObjectId} userId - The user ID claiming it
 */
export async function claimUsername(username, userId) {
  const usernameLowerCase = username.toLowerCase();
  
  const availability = await checkUsernameAvailability(username);
  if (!availability.available) {
    throw new Error(availability.message);
  }

  // Upsert the registry
  const record = await UsernameRegistry.findOneAndUpdate(
    { usernameLowerCase },
    {
      $set: {
        username,
        usernameLowerCase,
        ownerId: userId,
        status: "active",
        ownershipStartedAt: new Date(),
        reservedUntil: null,
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  return record;
}

/**
 * Releases an old username when a user changes their username or deletes their account.
 * Applies a 30-day reservation lock, or permanent lock if verified.
 * @param {string} oldUsername - The username being given up
 * @param {boolean} isVerified - Whether the user is a verified user
 * @param {ObjectId} userId - The user ID
 */
export async function releaseUsername(oldUsername, isVerified, userId) {
  const usernameLowerCase = oldUsername.toLowerCase();
  
  const status = isVerified ? "protected" : "reserved";
  const reservedUntil = isVerified ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const isProtected = isVerified;

  await UsernameRegistry.findOneAndUpdate(
    { usernameLowerCase, ownerId: userId, status: "active" },
    {
      $set: {
        status,
        reservedUntil,
        isProtected,
        ownerId: null // Remove ownership so it can't be used to login, but keep the status locked
      }
    }
  );

  await AuditLog.create({
    action: isVerified ? "USERNAME_PROTECTED" : "USERNAME_RESERVED",
    targetId: userId,
    details: { oldUsername, status, reservedUntil }
  });
}
