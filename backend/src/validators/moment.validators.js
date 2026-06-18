import Joi from "joi";

export const createMomentSchema = Joi.object({
  body: Joi.object({
    mediaUrl: Joi.string().max(80_000_000).required(),
    type: Joi.string().valid("image", "video").required(),
    durationMs: Joi.number().integer().min(1000).max(50000).optional(),
  }),
});

export const momentIdParam = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
});

export const createReplySchema = Joi.object({
  body: Joi.object({
    text: Joi.string().min(1).max(500).trim().required(),
  }),
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
});
