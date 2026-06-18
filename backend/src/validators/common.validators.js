import Joi from "joi";

export const mongoIdParam = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
});

export const paginationQuery = Joi.object({
  query: Joi.object({
    page: Joi.number().integer().min(1).max(1000).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),
});

export const searchQuery = Joi.object({
  query: Joi.object({
    query: Joi.string().min(1).max(100).trim().required(),
  }),
});

