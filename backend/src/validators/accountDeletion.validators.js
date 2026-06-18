import Joi from "joi";
import { DELETION_CONFIRM_PHRASE } from "../services/userData.service.js";

export const submitDeletionRequestSchema = Joi.object({
  body: Joi.object({
    password: Joi.string().min(1).max(128).required(),
    confirmPhrase: Joi.string().valid(DELETION_CONFIRM_PHRASE).required().messages({
      "any.only": `Confirmation phrase must be exactly: ${DELETION_CONFIRM_PHRASE}`,
    }),
    confirmEmail: Joi.string().email().max(254).required(),
    reason: Joi.string().max(500).allow("").optional(),
    dataDownloaded: Joi.boolean().valid(true).required().messages({
      "any.only": "You must download your data before submitting",
    }),
  }),
});

export const rejectDeletionRequestSchema = Joi.object({
  body: Joi.object({
    adminNote: Joi.string().max(500).allow("").optional(),
  }),
});

export const deletionRequestIdParam = Joi.object({
  params: Joi.object({
    requestId: Joi.string().hex().length(24).required(),
  }),
});
