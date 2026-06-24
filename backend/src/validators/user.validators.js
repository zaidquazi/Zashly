import Joi from "joi";

export const updateProfileSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(100).trim(),
    bio: Joi.string().max(500).allow("").trim(),
    location: Joi.string().max(120).allow("").trim(),
    profilePic: Joi.string().allow(""),
  }).min(1),
});

export const userIdParam = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
});
