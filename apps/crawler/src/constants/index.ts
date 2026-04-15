/**
 * Environment variable validation messages
 */
export const ENV_VALIDATION_MESSAGES = {
  CRAWLER_SHARED_SECRET_REQUIRED: "CRAWLER_SHARED_SECRET is required",
  WEB_CALLBACK_URL_INVALID: "WEB_CALLBACK_URL must be a valid URL",
} as const;

/**
 * Valid environment modes
 */
export const NODE_ENV_VALUES = ["development", "production", "test"] as const;
