# Spec 03 — Crawler Service (the core)

## Business Context
This is the heart of the product. Everything else is plumbing around the diff that this service produces. Quality of the report = quality of this code.

## Technical Context
Express service that exposes one main endpoint: `POST /crawl`. It accepts a URL + reportId, runs two parallel headless Chromium sessions, computes the diff, and POSTs results back to the web app via webhook.

## Implementation Steps

### 1. Endpoint contract

```
POST /crawl
Headers: Authorization: Bearer ${CRAWLER_SHARED_SECRET}
Body:    { reportId: string, url: string }
Returns: 202 Accepted immediately (job runs async)
```

On completion, crawler POSTs to `${WEB_CALLBACK_URL}` with the same shared secret:
```
{
  reportId: string,
  status: "done" | "error",
  error?: string,
  data?: CrawlResult
}
```

### 2. The `CrawlResult` shape

```ts
type CrawlResult = {
  url: string;
  finalUrl: string;            // after redirects
  pageTitle: string;

  unprotected: SessionMetrics;
  protected: SessionMetrics;

  blockedRequests: BlockedRequest[];   // detailed list
  companies: CompanySummary[];          // grouped + sorted
};

type SessionMetrics = {
  requestCount: number;
  totalBytes: number;
  loadTimeMs: number;          // domcontentloaded
};

type BlockedRequest = {
  url: string;                 // truncated to hostname + path, no query
  hostname: string;
  owner: string;
  category: string;
  bytes: number;               // estimated from response if available
};

type CompanySummary = {
  name: string;
  requestCount: number;
  categories: string[];        // unique categories used by this company
  domains: string[];           // unique tracker domains for this company
};
```

### 3. The diff algorithm

```ts
async function crawl(url: string): Promise<CrawlResult> {
  const browser = await chromium.launch();

  // Run both in parallel
  const [unprotected, protectedRun] = await Promise.all([
    runSession(browser, url, { block: false }),
    runSession(browser, url, { block: true }),
  ]);

  await browser.close();

  // Build company summary from protected.blockedRequests
  const companies = groupByOwner(protectedRun.blockedRequests);

  return {
    url,
    finalUrl: protectedRun.finalUrl,
    pageTitle: protectedRun.title,
    unprotected: unprotected.metrics,
    protected: protectedRun.metrics,
    blockedRequests: protectedRun.blockedRequests,
    companies,
  };
}
```

### 4. `runSession` details

- New context (incognito-like isolation)
- Stealth plugin enabled (so Cloudflare/PerimeterX doesn't outright reject us)
- Realistic UA + viewport (1280x800)
- `page.route('**/*', ...)` to intercept every request:
  - Get hostname from `route.request().url()`
  - If `block: true` and `lookupTracker(hostname)` returns non-null → `route.abort()` and record as blocked
  - Else → `route.continue()` and record as allowed
- Track `Date.now()` at navigation start; capture `domcontentloaded` event time
- Use `page.on('response', ...)` to estimate response bytes via `Content-Length` header (best-effort)
- 30s hard timeout; abort and throw a typed error if exceeded

### 5. Concurrency guard
- In-process counter; reject new jobs with 503 if `MAX_CONCURRENT_JOBS` reached
- Job queue is **not** required for v1; under load just return 503 and let the web app retry

### 6. SSRF protection
- Before navigating, `dns.lookup` the hostname
- Reject if address is in any private range (10/8, 172.16/12, 192.168/16, 127/8, IPv6 ULA, link-local)
- Reject schemes other than http/https

### 7. Webhook callback
- Use `fetch` with the shared secret in `Authorization` header
- 3 retries with exponential backoff if callback fails
- Log (via pino) the reportId + status, never the full URL

## Acceptance Criteria
- [ ] `POST /crawl` returns 202 within 100ms and starts work async
- [ ] On a known site (e.g. cnn.com), `unprotected.requestCount > protected.requestCount`
- [ ] On a known site, `companies` list contains "Google LLC" or "Meta Platforms, Inc."
- [ ] Reports include at least 5 distinct categories across major test sites
- [ ] Crawl times out cleanly at 30s, callback fires with `status: "error"`
- [ ] Private-IP URLs are rejected with 400
- [ ] Concurrency cap prevents OOM (test: fire 10 requests, 7 get 503)
- [ ] Callback delivers the data to web app and is processed (verify in spec 05)

## Test URLs (for manual verification)
- `https://www.cnn.com` — expect 30+ trackers, many companies
- `https://www.bbc.com` — expect moderate, mostly Chartbeat/Google
- `https://duckduckgo.com` — expect ~0 trackers (sanity check; the irony is the demo)
- `https://example.com` — expect 0 trackers (true minimum)

## Notes for Cursor
- Use `playwright-extra` + `puppeteer-extra-plugin-stealth` to reduce bot detection
- If a site flat-out blocks the headless browser, return a partial result with a flag, not a full failure
- Never include query strings in logged URLs — strip them
- After completing: update `01-BUILD-PLAN.md`.
