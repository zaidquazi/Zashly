import Joi from "joi";

export const groupIdParam = Joi.object({
  params: Joi.object({
    groupId: Joi.string().hex().length(24).required(),
  }).unknown(true),
});

export const groupUserIdParams = Joi.object({
  params: Joi.object({
    groupId: Joi.string().hex().length(24).required(),
    userId: Joi.string().hex().length(24).required(),
  }).unknown(true),
});

export const createGroupSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(100).required().trim(),
    description: Joi.string().max(500).allow("").trim().optional(),
    memberIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(1)
      .required(),
  }),
});

export const updateGroupSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(1).max(100).trim().optional(),
    description: Joi.string().max(500).allow("").trim().optional(),
    avatar: Joi.string().uri().allow("").optional(),
    settings: Joi.object({
      requireApproval: Joi.boolean().optional(),
      editInfo: Joi.string().valid("all", "admins").optional(),
    }).optional(),
  }).min(1),
});

export const addMembersSchema = Joi.object({
  body: Joi.object({
    memberIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .min(1)
      .required(),
  }),
});
