# Crawler Service Design — Spec 03

**Date:** 2026-04-15
**Spec:** `docs/03-crawler-service.md`
**Status:** Approved

---

## Decisions Made

| Question | Decision |
|---|---|
| Integration pattern | Async webhook — 202 immediately, callback on completion |
| Shared types strategy | Use existing `AnalysisResult` from `packages/shared`, enriched with per-session data |
| Per-session metrics | Add `SessionMetrics`, `finalUrl`, `pageTitle`, `partial` to `AnalysisResult` |
| Stealth approach | `playwright-extra` + `puppeteer-extra-plugin-stealth` (already a dependency) |
| Browser sessions | Single browser instance, two parallel contexts via `Promise.allSettled` |
| Error strategy | Partial results with `partial: true` flag when one session fails; bot-challenge detection returns error |
| Architecture | Layered: Router → Controller → Service → Crawler modules |

---

## Section 1: Shared Types Changes

File: `packages/shared/src/types.ts`

### New type — `SessionMetrics`

```typescript
type SessionMetrics = {
  requestCount: number;
  totalBytes: number;
  loadTimeMs: number;   // domcontentloaded
};
```

### Enriched `AnalysisResult`

Add to the existing type:

```typescript
type AnalysisResult = {
  // existing fields (unchanged)
  url: string;
  totalRequests: number;
  blockedRequests: number;
  bytesSaved: number;
  loadTimeSavedMs: number;
  blocked: BlockedRequest[];
  byOwner: TrackerOwnerSummary[];
  categories: Record<string, number>;
  crawledAt: string;

  // new fields
  finalUrl: string;              // after redirects
  pageTitle: string;             // document title
  partial: boolean;              // true if one session failed
  unprotected: SessionMetrics;   // raw browser, no blocking
  protected: SessionMetrics;     // with tracker blocking active
};
```

Negative diff values (`bytesSaved`, `loadTimeSavedMs`) are clamped to 0 — the protected session can be marginally slower due to route interception overhead.

### Enriched `TrackerOwnerSummary`

Add `categories: string[]` — all unique categories observed for this owner:

```typescript
type TrackerOwnerSummary = {
  owner: string;
  category: string;           // primary category (first observed)
  requestCount: number;
  domains: string[];
  categories: string[];       // NEW — all unique categories
};
```

---

## Section 2: Request Flow & API Contract

### Endpoint

```
POST /crawl
Headers: Authorization: Bearer ${CRAWLER_SHARED_SECRET}
Body:    { reportId: string, url: string, callbackUrl: string }

202 Accepted  →  { reportId, status: "accepted" }
400 Bad Request → invalid input or private IP (SSRF)
401 Unauthorized → missing/wrong bearer token
503 Service Unavailable → concurrency cap reached
```

### Async callback (crawler → web app)

On completion, crawler POSTs to `callbackUrl`:

```typescript
// success
{ reportId, status: "done", data: AnalysisResult }

// failure
{ reportId, status: "error", error: string }
```

Uses `Authorization: Bearer ${CRAWLER_SHARED_SECRET}` header. 3 retries with exponential backoff (1s, 2s, 4s).

### Lifecycle

```
Web App                          Crawler Service
  │                                    │
  ├─── POST /crawl ──────────────────► │
  │                                    ├── auth middleware (Bearer token)
  │                                    ├── controller: Zod validate body
  │                                    ├── controller: ssrfGuard(url)
  │                                    ├── controller: concurrency check
  │    ◄── 202 { status: "accepted" }──┤
  │                                    │
  │                                    ├── [async] launch browser (stealth)
  │                                    ├── [async] Promise.allSettled([
  │                                    │     runSession(browser, url, { block: false }),
  │                                    │     runSession(browser, url, { block: true })
  │                                    │   ])
  │                                    ├── [async] buildResult(unprotected, protected, url)
  │                                    ├── [async] browser.close() — always in finally
  │                                    ├── [async] decrement counter — always in finally
  │                                    │
  │    ◄── POST callbackUrl ───────────┤  CrawlCallback (done | error)
```

---

## Section 3: Session Runner

File: `apps/crawler/src/crawler/session-runner.ts`

Single exported function `runSession(browser, url, options, trackerMap)`.

**Setup per context:**
- New browser context (incognito isolation)
- Stealth via `playwright-extra` plugin
- UA: `Mozilla/5.0 ... Chrome/120`, viewport `1280x800`

**Request interception via `page.route('**/*', handler)`:**
- Parse hostname from request URL
- If `options.block && lookupTracker(hostname)` returns a match → `route.abort()`, push to `blockedList`
- Otherwise → `route.continue()`, increment `allowedCount`

**Metrics collection:**
- `page.on('response', ...)` — read `Content-Length` header (best-effort, 0 if missing) for byte estimation
- `startTime = Date.now()` before `page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })`
- `loadTimeMs = Date.now() - startTime` after navigation

**Bot challenge detection:**
After navigation, check `page.title()` for patterns: `"Just a moment"`, `"Attention Required"`, `"Access Denied"`, `"Verifying you are human"`. If matched, set `botDetected: true` on the result rather than throwing.

**Return type:**

```typescript
type SessionResult = {
  finalUrl: string;
  pageTitle: string;
  botDetected: boolean;
  metrics: SessionMetrics;
  blockedList: BlockedRequest[];   // empty when block=false
};
```

**Errors thrown:**
- `CrawlTimeoutError` — navigation exceeds 30s
- `CrawlNavigationError` — DNS failure, connection refused, etc.

---

## Section 4: Result Builder

File: `apps/crawler/src/crawler/result-builder.ts`

Pure data transformation — no I/O, no side effects, fully unit-testable.

**Inputs:** `unprotected: SessionResult`, `protected: SessionResult`, `url: string`, `partial: boolean`

**Logic:**

1. **Diff computation:**
   - `blockedRequests = protected.blockedList.length`
   - `bytesSaved = Math.max(0, unprotected.metrics.totalBytes - protected.metrics.totalBytes)`
   - `loadTimeSavedMs = Math.max(0, unprotected.metrics.loadTimeMs - protected.metrics.loadTimeMs)`

2. **Group by owner:**
   - Iterate `protected.blockedList`, group by `tracker.owner`
   - Per owner: count requests, collect unique `domains`, collect unique `categories`
   - Sort descending by `requestCount`

3. **Category aggregation:**
   - Count occurrences of each `tracker.category` across all blocked requests
   - Result: `Record<string, number>` e.g. `{ "Advertising": 23, "Analytics": 11 }`

4. **Assemble `AnalysisResult`:**
   - `finalUrl` and `pageTitle` from protected session (the "with DDG" experience)
   - `crawledAt = new Date().toISOString()`

**Partial result handling:** If one session failed, use zeroed `SessionMetrics` (`{ requestCount: 0, totalBytes: 0, loadTimeMs: 0 }`) for the failed side. Set `partial: true`.

---

## Section 5: Security & Infrastructure

### SSRF Guard (`security/ssrf-guard.ts`)

- Rejects non-http/https schemes
- Runs `dns.lookup()` on hostname
- Blocks private IP ranges: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `0.0.0.0`, `::1`, `fc00::/7`, `fe80::/10`
- Returns `{ safe: true, resolvedIp }` or throws `SsrfError`
- Called before any browser is launched

### Auth Middleware (`middleware/auth.middleware.ts`)

- Checks `Authorization: Bearer ${env.crawlerSharedSecret}` on `POST /crawl` only
- 401 with `{ error: "Unauthorized" }` on mismatch
- `GET /health` remains unauthenticated

### Callback Service (`services/callback.service.ts`)

- `sendCallback(callbackUrl: string, payload: CrawlCallback): Promise<void>`
- `Authorization: Bearer ${env.crawlerSharedSecret}` on all outbound requests
- 3 retries, exponential backoff: 1s → 2s → 4s
- Logs: `reportId` + `status` on success; `reportId` + attempt + error message on failure
- Never logs full URLs — hostname only
- Swallows error after all retries exhausted (crawl is done, nothing to roll back) but logs as critical

### Logger (`logger.ts`)

- Single pino instance, JSON output
- No query strings in any logged URL
- No callback payload data logged

---

## Section 6: Router / Controller / Service Layer

### Router (`routes/crawl.route.ts`) — paper-thin

```typescript
router.post('/crawl', authMiddleware, crawlController.handleCrawl);
```

Only binds verb + path + middleware to controller. No logic.

### Controller (`controllers/crawl.controller.ts`) — orchestrator

Responsibilities:
1. Zod validate body: `{ url: z.string().url(), reportId: z.string().min(1), callbackUrl: z.string().url() }`
2. Call `ssrfGuard(url)` → 400 on `SsrfError`
3. Check concurrency counter → 503 if at cap
4. Fire `crawlService.executeCrawl(...)` without `await`
5. Return `202 { reportId, status: "accepted" }`
6. Error-to-status mapping: validation → 400, SSRF → 400, unexpected → 500

### Service (`services/crawl.service.ts`) — executor

No `req`/`res`, no HTTP concepts:
- `executeCrawl(url, reportId, callbackUrl): Promise<void>`
- Increment counter → launch browser → `Promise.allSettled` sessions → build result → fire callback → close browser + decrement counter in `finally`

### Layer boundaries

| Layer | HTTP-aware | Responsibilities |
|---|---|---|
| Router | Yes | Verb + path + middleware binding only |
| Controller | Yes | Validation, guards, dispatch, response shaping, error→status mapping |
| Service | No | Browser lifecycle, session orchestration, result building, callback delivery |
| Crawler modules | No | Playwright session, request interception, data transformation |

---

## Final File Tree

```
apps/crawler/src/
├── index.ts                         # updated — wire routes, store tracker map
├── env.ts                           # unchanged
├── logger.ts                        # NEW — pino instance
├── routes/
│   └── crawl.route.ts               # NEW — thin router
├── controllers/
│   └── crawl.controller.ts          # NEW — orchestrator
├── services/
│   ├── crawl.service.ts             # NEW — business logic
│   └── callback.service.ts          # NEW — webhook + retries
├── crawler/
│   ├── session-runner.ts            # NEW — single Playwright context
│   ├── request-interceptor.ts       # NEW — block/allow per tracker map
│   └── result-builder.ts            # NEW — raw data → AnalysisResult
├── security/
│   └── ssrf-guard.ts                # NEW — DNS + private IP check
├── middleware/
│   └── auth.middleware.ts           # NEW — Bearer token check
├── errors/
│   └── index.ts                     # NEW — CrawlTimeoutError, CrawlNavigationError, SsrfError
├── constants/
│   └── index.ts                     # updated — CRAWL_TIMEOUT_MS, RETRY_DELAYS, BOT_PATTERNS
├── tracker-map-loader.ts            # unchanged
└── data/
    └── tracker-map.json             # unchanged

packages/shared/src/
└── types.ts                         # updated — SessionMetrics, enriched AnalysisResult + TrackerOwnerSummary
```

---

## Acceptance Criteria (from spec)

- [ ] `POST /crawl` returns 202 within 100ms and starts work async
- [ ] On a known site (e.g. cnn.com), `unprotected.requestCount > protected.requestCount`
- [ ] On a known site, `byOwner` list contains "Google LLC" or "Meta Platforms, Inc."
- [ ] Reports include at least 5 distinct categories across major test sites
- [ ] Crawl times out cleanly at 30s, callback fires with `status: "error"`
- [ ] Private-IP URLs are rejected with 400
- [ ] Concurrency cap prevents OOM (test: fire 10 requests, 7 get 503)
- [ ] Callback delivers the data to web app and is processed (verify in spec 05)
