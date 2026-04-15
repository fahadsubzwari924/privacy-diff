/**
 * Environment variable validation messages
 */
export const ENV_VALIDATION_MESSAGES = {
  DATABASE_URL_INVALID: "DATABASE_URL must be a valid URL",
  CRAWLER_URL_INVALID: "CRAWLER_URL must be a valid URL",
  CRAWLER_SHARED_SECRET_REQUIRED: "CRAWLER_SHARED_SECRET is required",
  PUBLIC_BASE_URL_INVALID: "PUBLIC_BASE_URL must be a valid URL",
} as const;

/**
 * Valid environment modes
 */
export const NODE_ENV_VALUES = ["development", "production", "test"] as const;
