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
 * Aggregated data per tracker owner (e.g. "Google LLC").
 */
export type TrackerOwnerSummary = {
  owner: string;
  category: string;
  requestCount: number;
  domains: string[];
};

/**
 * The full analysis result produced by the crawler.
 */
export type AnalysisResult = {
  url: string;
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
 * Payload sent from apps/web → apps/crawler to kick off a crawl job.
 */
export type CrawlRequest = {
  url: string;
  reportId: string;
  callbackUrl: string;
};

/**
 * Payload sent from apps/crawler → apps/web when a crawl completes.
 */
export type CrawlCallback =
  | { reportId: string; status: "done"; data: AnalysisResult }
  | { reportId: string; status: "error"; error: string };

/**
 * Report status as persisted in the database.
 */
export type ReportStatus = "queued" | "running" | "done" | "error";
