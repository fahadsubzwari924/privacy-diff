/**
 * A single tracker domain entry from DuckDuckGo's Tracker Radar / TDS data.
 * https://github.com/duckduckgo/tracker-radar
 */
export type TrackerEntry = {
  domain: string;
  owner: string;
  category: string;
  prevalence?: number;
};

/**
 * A single blocked request recorded during a crawl.
 */
export type BlockedRequest = {
  url: string;
  hostname: string;
  tracker: TrackerEntry;
  bytesSaved?: number;
};

/**
 * Per-session crawl metrics captured during a single Playwright browser context.
 */
export type SessionMetrics = {
  requestCount: number;
  totalBytes: number;
  loadTimeMs: number;
};

/**
 * Aggregated metrics for one tracker owner (e.g. "Google LLC") across domains.
 */
export type TrackerOwnerSummary = {
  owner: string;
  primaryCategory: string;
  requestCount: number;
  domains: string[];
  allCategories: string[];
};

/**
 * Full comparison result from the crawler (unprotected vs protected session).
 */
export type AnalysisResult = {
  url: string;
  finalUrl: string;
  pageTitle: string;
  /** True when one of the two Playwright sessions failed; data from the failed side is zeroed. */
  partial: boolean;
  unprotected: SessionMetrics;
  protected: SessionMetrics;
  totalRequests: number;
  blockedRequests: number;
  bytesSaved: number;
  loadTimeSavedMs: number;
  blocked: BlockedRequest[];
  byOwner: TrackerOwnerSummary[];
  categories: Record<string, number>;
  crawledAt: string;
};

/**
 * Payload sent from apps/web to apps/crawler to start a crawl job.
 */
export type CrawlRequest = {
  url: string;
  reportId: string;
  callbackUrl: string;
};

/**
 * Callback payload from apps/crawler to apps/web when a crawl finishes or errors.
 */
export type CrawlCallback =
  | { reportId: string; status: 'done'; data: AnalysisResult }
  | { reportId: string; status: 'error'; error: string };

/**
 * Report lifecycle status as persisted in the database.
 */
export type ReportStatus = 'queued' | 'running' | 'done' | 'error';
