export const ENV_VALIDATION_MESSAGES = {
  PORT_REQUIRED: "PORT is required",
  SECRET_REQUIRED: "CRAWLER_SHARED_SECRET is required",
  CALLBACK_URL_REQUIRED: "WEB_CALLBACK_URL is required",
  MAX_JOBS_REQUIRED: "MAX_CONCURRENT_JOBS is required",
  WEB_CALLBACK_URL_INVALID: "WEB_CALLBACK_URL must be a valid URL",
} as const;

export const NODE_ENV_VALUES = ["development", "production", "test"] as const;

export const NODE_ENV_PRODUCTION = "production" as const;

export const CRAWL_TIMEOUT_MS = 30_000;

export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

export const BOT_CHALLENGE_PATTERNS = [
  "just a moment",
  "attention required",
  "access denied",
  "verifying you are human",
  "ddos-guard",
  "cloudflare",
] as const;

export const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe[89ab][0-9a-f]:/i,
] as const;

export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export const BROWSER_VIEWPORT = { width: 1280, height: 800 } as const;

export const ROUTE_INTERCEPT_PATTERN = "**/*";

export const PAGE_WAIT_UNTIL = "domcontentloaded" as const;

export const TIMEOUT_ERROR_KEYWORDS = ["Timeout", "timeout"] as const;

export const APP_LOCALS_KEYS = {
  TRACKER_MAP: "trackerMap",
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SSRF_REJECTED: "SSRF_REJECTED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CAPACITY_EXCEEDED: "CAPACITY_EXCEEDED",
  UNAUTHORIZED: "UNAUTHORIZED",
} as const;

export const CRAWL_JOB_STATUS = {
  ACCEPTED: "accepted",
} as const;

export const ERROR_MESSAGES = {
  BOTH_SESSIONS_FAILED: "Both sessions failed",
  BOT_BLOCKED: "Site blocked automated browsing",
  UNEXPECTED_ERROR: "Unexpected error",
  INVALID_AUTH: "Invalid or missing authorization token",
  INVALID_BODY: "Invalid request body",
  SSRF_URL_VALIDATION: "Unexpected error during URL validation",
  CAPACITY_EXCEEDED: "Crawler is at capacity, retry later",
  CRAWL_TIMEOUT: (seconds: number) => `Crawl timed out after ${seconds}s`,
  NAVIGATION_FAILED: (cause: string) => `Navigation failed: ${cause}`,
} as const;
