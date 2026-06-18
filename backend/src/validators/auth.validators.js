import Joi from "joi";

const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .messages({
    "string.pattern.base":
      "Password must include uppercase, lowercase, and a number",
  });

export const signupSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().min(3).max(20).pattern(/^[a-z0-9_]+$/).required().lowercase().trim(),
    password: passwordSchema.required(),
  }),
});

export const loginSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().required().lowercase().trim(),
    password: Joi.string().min(1).max(128).required(),
    rememberMe: Joi.boolean().optional(),
  }),
});

export const onboardSchema = Joi.object({
  body: Joi.object({
    fullName: Joi.string().min(2).max(100).trim(),
    username: Joi.string().min(3).max(20).pattern(/^[a-z0-9_]+$/).lowercase().trim(),
    dateOfBirth: Joi.string().isoDate().allow(""),
    gender: Joi.string().valid("Male", "Female", "Prefer Not To Say", "Custom").allow(""),
    bio: Joi.string().max(500).allow("").trim(),
    location: Joi.string().max(120).allow("").trim(),
    profilePic: Joi.string().allow(""), // It might be base64 since we compress it on frontend
    nativeLanguage: Joi.string().max(50).allow(""),
    learningLanguage: Joi.string().max(50).allow(""),
  }).min(1),
});

export const forgotPasswordSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().required().lowercase().trim(),
    isCheck: Joi.boolean().optional(),
  }),
});

export const resetPasswordSchema = Joi.object({
  body: Joi.object({
    username: Joi.string().lowercase().trim().optional(),
    resetToken: Joi.string().min(10).max(256).required(),
    newPassword: passwordSchema.required(),
  }),
});

export const verifyEmailSchema = Joi.object({
  body: Joi.object({
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),
});

export const refreshTokenSchema = Joi.object({
  body: Joi.object({}).optional(),
});
