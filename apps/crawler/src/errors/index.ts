import { CRAWL_TIMEOUT_MS, ERROR_MESSAGES } from "../constants/index.js";

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

export class CrawlTimeoutError extends Error {
  constructor() {
    super(ERROR_MESSAGES.CRAWL_TIMEOUT(CRAWL_TIMEOUT_MS / 1_000));
    this.name = "CrawlTimeoutError";
  }
}

export class CrawlNavigationError extends Error {
  constructor(cause: string) {
    super(ERROR_MESSAGES.NAVIGATION_FAILED(cause));
    this.name = "CrawlNavigationError";
  }
}
