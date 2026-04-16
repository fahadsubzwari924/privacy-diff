// ---------------------------------------------------------------------------
// Static copy
// ---------------------------------------------------------------------------

export const REPORT_PAGE = {
  REPORT_FOR_LABEL: "Report for",
  ANALYZE_LINK_TEXT: "Analyze →",
} as const;

export const METADATA = {
  ANALYZING_TITLE: "Privacy Diff — Analyzing…",
} as const;

export const HERO_STAT = {
  ZERO_HEADING: "No trackers detected",
  ZERO_BODY: "This site respects your privacy.",
  TRACKERS_BLOCKED_LABEL: "trackers blocked",
  FROM_LABEL: "from",
  COMPANY_SINGULAR: "company",
  COMPANY_PLURAL: "companies",
  SAVINGS_PREFIX: "That's",
  SAVINGS_DATA_INFIX: "of data and",
  SAVINGS_TIME_SUFFIX: "of load time you didn't have to give them.",
} as const;

export const METRICS_COMPARE = {
  SECTION_HEADING: "Side-by-side",
  UNPROTECTED_TITLE: "Without protection",
  PROTECTED_TITLE: "With DuckDuckGo protection",
  LABEL_REQUESTS: "Requests",
  LABEL_DATA: "Data transferred",
  LABEL_LOAD_TIME: "Load time",
  EMPTY_VALUE: "—",
} as const;

export const COMPANY_LIST = {
  SECTION_HEADING: "Who was watching?",
  REQ_SUFFIX: "req",
  SHOW_LESS: "Show less",
  /** Number of companies shown before the expand toggle appears. */
  TOP_N: 10,
} as const;

export const CATEGORY_CHART = {
  SECTION_HEADING: "Categories",
} as const;

export const SHARE_BUTTON = {
  LABEL: "Share",
  LABEL_COPIED: "Copied!",
  TOAST_SUCCESS: "Link copied to clipboard.",
  TOAST_NO_SUPPORT: "Copy not supported in this browser.",
  TOAST_ERROR: "Could not copy link.",
} as const;

export const DOWNLOAD_CTA = {
  DDG_APP_URL: "https://duckduckgo.com/app",
  HEADING: "Get this protection automatically.",
  BODY: "DuckDuckGo blocks trackers on every site, every time — no report needed.",
  BUTTON_TEXT: "Download DuckDuckGo Browser →",
} as const;

export const DUAL_SCAN_VIEW = {
  PANE_UNPROTECTED_LABEL: "Without Protection",
  PANE_PROTECTED_LABEL: "DuckDuckGo Protected",
  HEADING_PREFIX: "Analyzing",
  SCANNING_SUBTITLE: "This takes 10–40 seconds",
  COMPLETE_LABEL: "Scan complete ✓",
  BLOCKED_SUFFIX: "trackers blocked",
  ZERO_BLOCKED_LABEL: "No trackers detected ✓",
  /** How often to poll the status endpoint (ms). */
  POLL_INTERVAL_MS: 2_000,
  /** How often to add a fake request row (ms). */
  REQUEST_FEED_INTERVAL_MS: 300,
  /** Maximum visible rows in the request feed before old ones scroll off. */
  REQUEST_FEED_MAX_VISIBLE: 7,
  /** Progress rate during fast phase (% per 100ms tick). */
  PROGRESS_FAST_RATE: 0.6,
  /** Progress rate during slow/stall phase (% per 100ms tick). */
  PROGRESS_SLOW_RATE: 0.04,
  /** Time after which progress switches to slow phase (ms). */
  PROGRESS_STALL_THRESHOLD_MS: 12_000,
  /** Natural cap — progress never reaches 100% until real completion. */
  PROGRESS_NATURAL_CAP: 90,
  /** Maximum time before giving up on the scan (ms). */
  POLL_TIMEOUT_MS: 90_000,
  /** How long to show the reveal before navigating to the report (ms). */
  REVEAL_DELAY_MS: 2_000,
  /** Duration of the blocked-count counter animation (ms). */
  COUNTER_DURATION_MS: 800,
  /** Number of counter steps in the animation. */
  COUNTER_STEPS: 20,
} as const;

/** Well-known tracker domains sampled for the fake request feed simulation. */
export const TRACKER_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "connect.facebook.net",
  "hotjar.com",
  "scorecardresearch.com",
  "criteo.com",
  "outbrain.com",
  "taboola.com",
  "moatads.com",
  "ads.amazon-adsystem.com",
  "pixel.quantserv.com",
  "cdn.segment.com",
  "bat.bing.com",
] as const;

/** Fake first-party-style path suffixes used in the request feed simulation. */
export const FIRST_PARTY_PATHS = [
  "main.js",
  "styles.css",
  "bundle.js",
  "config.json",
  "fonts.woff2",
  "logo.svg",
  "app.chunk.js",
] as const;

export const REPORT_ERROR = {
  HEADING: "Analysis failed",
  GENERIC_BODY: "Something went wrong during analysis. Please try again.",
  TRY_ANOTHER_LINK: "← Try another site",
} as const;

export const SITE_HEADER = {
  BRAND_NAME: "Privacy Diff",
  BACK_ARROW: "←",
} as const;

export const SITE_FOOTER = {
  TRACKER_RADAR_URL: "https://github.com/duckduckgo/tracker-radar",
  TRACKER_RADAR_LABEL: "DuckDuckGo's open Tracker Radar",
  BUILT_ON_PREFIX: "Built on",
} as const;

export const OG_IMAGE = {
  BRAND_NAME: "Privacy Diff",
  TRACKERS_BLOCKED_LABEL: "trackers blocked",
  ON_PREPOSITION: "on",
  COMPANY_SINGULAR: "company was watching",
  COMPANY_PLURAL: "companies were watching",
  CTA_TEXT: "See the full report →",
} as const;

// ---------------------------------------------------------------------------
// Dynamic string builders (template strings with runtime values)
// ---------------------------------------------------------------------------

export function buildMetadataTitle(blockedCount: number, host: string): string {
  return `${blockedCount} trackers blocked on ${host} — Privacy Diff`;
}

export function buildMetadataDescription(companyCount: number): string {
  const noun = companyCount === 1 ? "company was" : "companies were";
  return `${companyCount} ${noun} watching. See the full breakdown.`;
}

export function buildBlockedSiteError(host: string): string {
  return `We couldn't load ${host}. Some sites block automated browsers.`;
}

export function buildShowAllLabel(count: number): string {
  return `Show all ${count} companies`;
}
