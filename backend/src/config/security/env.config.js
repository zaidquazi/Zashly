/**
 * Environment validation — fails fast at boot if secrets or required vars are missing.
 * Prevents running production with weak/missing JWT_SECRET or exposed defaults.
 */
import Joi from "joi";
import crypto from "crypto";

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(5002),
  MONGO_URI: Joi.string().required().messages({
    "any.required": "MONGO_URI is required — never commit database credentials to git",
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    "string.min": "JWT_SECRET must be at least 32 characters for production-grade entropy",
  }),
  JWT_REFRESH_SECRET: Joi.string().min(32).optional(),
  JWT_ACCESS_EXPIRES: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES: Joi.string().default("7d"),
  CLIENT_URL: Joi.string().uri().optional(),
  CLIENT_URLS: Joi.string().optional(), // comma-separated origins for CORS
  STREAM_API_KEY: Joi.string().optional(),
  STREAM_API_SECRET: Joi.string().optional(),
  LIVEKIT_API_KEY: Joi.string().optional(),
  LIVEKIT_API_SECRET: Joi.string().optional(),
  LIVEKIT_URL: Joi.string().uri().optional(),
  TRUST_PROXY: Joi.string().valid("true", "false").default("false"),
  ENABLE_EMAIL_VERIFICATION: Joi.string().valid("true", "false").default("false"),
  MAX_LOGIN_ATTEMPTS: Joi.number().integer().min(3).default(5),
  ACCOUNT_LOCK_MINUTES: Joi.number().integer().min(1).default(15),
}).unknown(true);

let cachedEnv = null;

export function validateEnv() {
  if (cachedEnv) return cachedEnv;

  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const details = error.details.map((d) => `  - ${d.message}`).join("\n");
    console.error("\n❌ Environment validation failed:\n" + details + "\n");
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    console.warn("⚠️  Continuing in non-production mode with invalid env (fix before deploy).\n");
  }

  const refreshSecret =
    value.JWT_REFRESH_SECRET || crypto.createHmac("sha256", value.JWT_SECRET).update("refresh_salt_v1_strong").digest("hex");

  if (value.NODE_ENV === "production" && !process.env.JWT_REFRESH_SECRET) {
    console.warn(
      "⚠️  JWT_REFRESH_SECRET not set — using derived secret. Set a distinct secret in production."
    );
  }

  cachedEnv = {
    ...value,
    JWT_REFRESH_SECRET: refreshSecret,
    isProduction: value.NODE_ENV === "production",
    isDevelopment: value.NODE_ENV === "development",
  };
  return cachedEnv;
}
