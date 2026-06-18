import Joi from "joi";

const mongoId = Joi.string().hex().length(24);

export const createRoomSchema = Joi.object({
  body: Joi.object({
    callType: Joi.string().valid("voice", "video").required(),
    callMode: Joi.string().valid("personal", "group").required(),
    targetId: mongoId.when("callMode", { is: "personal", then: Joi.required(), otherwise: Joi.optional() }),
    groupId: mongoId.when("callMode", { is: "group", then: Joi.required(), otherwise: Joi.optional() }),
    participantIds: Joi.array().items(mongoId).max(50).optional(),
  }),
});

export const tokenSchema = Joi.object({
  body: Joi.object({
    callId: Joi.string().min(8).max(64).required(),
    roomName: Joi.string().min(8).max(128).required(),
  }),
});

export const endCallSchema = Joi.object({
  body: Joi.object({
    callId: Joi.string().min(8).max(64).required(),
    roomName: Joi.string().min(8).max(128).optional(),
  }),
});

export const callIdParam = Joi.object({
  params: Joi.object({
    id: mongoId.required(),
  }),
});

export const historyQuery = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(30),
  }),
});

export const removeParticipantSchema = Joi.object({
  body: Joi.object({
    callId: Joi.string().required(),
    roomName: Joi.string().required(),
    participantId: mongoId.required(),
  }),
});
