import Joi from "joi";

export const idParam = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }).unknown(true),
});

export const strikeSchema = Joi.object({
  body: Joi.object({
    reason: Joi.string().min(1).max(500).required(),
  }),
});

export const resolveReportSchema = Joi.object({
  body: Joi.object({
    status: Joi.string().valid("pending", "reviewed", "actioned").required(),
  }),
});

export const ipBanSchema = Joi.object({
  body: Joi.object({
    ip: Joi.string().ip().required(),
    reason: Joi.string().min(1).max(500).required(),
  }),
});

export const announcementSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    message: Joi.string().min(1).max(2000).required(),
    type: Joi.string().valid("info", "warning", "error").optional(),
  }),
});

export const addBannedWordSchema = Joi.object({
  body: Joi.object({
    word: Joi.string().min(1).max(100).required().lowercase().trim(),
    severity: Joi.string().valid("low", "medium", "high").optional(),
    action: Joi.string().valid("censor", "block", "strike").optional(),
  }),
});

export const updateBannedWordSchema = Joi.object({
  body: Joi.object({
    severity: Joi.string().valid("low", "medium", "high").optional(),
    action: Joi.string().valid("censor", "block", "strike").optional(),
    isActive: Joi.boolean().optional(),
  }).min(1),
});

export const updateAdminRoleSchema = Joi.object({
  body: Joi.object({
    role: Joi.string().valid("admin", "moderator").required(),
  }),
});
