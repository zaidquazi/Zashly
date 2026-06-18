import { requireRole } from "./auth.middleware.js";

/** Accessible by all staff (Owner, Admin, Moderator) */
export const requireAdmin = requireRole("admin", "owner", "moderator");

/** Accessible by Owners and Admins (No Moderators) */
export const requireOwnerOrAdmin = requireRole("admin", "owner");

/** Accessible ONLY by Owners (Admin Management) */
export const requireOwner = requireRole("owner");
