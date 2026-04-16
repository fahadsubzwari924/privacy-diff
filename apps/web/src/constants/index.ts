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

/** Analyze body: max URL length (chars) */
export const ANALYZE_URL_MAX_LENGTH = 2000;

/** Rolling window for analyze rate limit (ms) */
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/** HTTP API stable error codes */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PRIVATE_URL_REJECTED: "PRIVATE_URL_REJECTED",
  RATE_LIMITED: "RATE_LIMITED",
  CRAWLER_UNREACHABLE: "CRAWLER_UNREACHABLE",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
} as const;

/** Human-readable error messages stored in DB or returned to callers */
export const ERROR_MESSAGES = {
  CRAWLER_UNREACHABLE: "crawler unreachable",
} as const;
