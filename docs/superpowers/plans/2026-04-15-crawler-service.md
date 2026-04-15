# Crawler Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Agency role:** `@agency-backend-architect.mdc` — prepend this to every implementation task prompt.

**Goal:** Implement `POST /crawl` on the Express crawler service — dual Playwright sessions, tracker-blocking diff, `AnalysisResult` output, async webhook callback to the web app.

**Architecture:** Layered Router → Controller → Service → Crawler modules. Controller owns all HTTP decisions (validation, SSRF guard, concurrency check, 202 response). Service owns browser lifecycle, session orchestration, result building, and callback delivery. Crawler modules (session-runner, result-builder) are pure logic with no HTTP coupling.

**Tech Stack:** Express, TypeScript, playwright-extra, puppeteer-extra-plugin-stealth, pino, Zod, Node.js `dns` module, `fetch` (native Node 18+)

**Design doc:** `docs/superpowers/specs/2026-04-15-crawler-service-design.md`

**Spec:** `docs/03-crawler-service.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `packages/shared/src/types.ts` | Add `SessionMetrics`, enrich `AnalysisResult`, add `categories[]` to `TrackerOwnerSummary` |
| Create | `apps/crawler/src/logger.ts` | Single pino instance exported for all modules |
| Create | `apps/crawler/src/errors/index.ts` | `CrawlTimeoutError`, `CrawlNavigationError`, `SsrfError` typed error classes |
| Modify | `apps/crawler/src/constants/index.ts` | Add `CRAWL_TIMEOUT_MS`, `RETRY_DELAYS`, `BOT_CHALLENGE_PATTERNS`, `PRIVATE_IP_RANGES` |
| Create | `apps/crawler/src/security/ssrf-guard.ts` | DNS lookup + private IP rejection |
| Create | `apps/crawler/src/middleware/auth.middleware.ts` | Bearer token check against `env.crawlerSharedSecret` |
| Create | `apps/crawler/src/crawler/request-interceptor.ts` | `createInterceptHandler` — block or allow per tracker map |
| Create | `apps/crawler/src/crawler/session-runner.ts` | `runSession` — single Playwright context, metrics, bot detection |
| Create | `apps/crawler/src/crawler/result-builder.ts` | `buildResult` — pure transformation: sessions → `AnalysisResult` |
| Create | `apps/crawler/src/services/callback.service.ts` | `sendCallback` — webhook delivery with 3-retry exponential backoff |
| Create | `apps/crawler/src/services/crawl.service.ts` | `executeCrawl` — orchestrates browser, sessions, result, callback |
| Create | `apps/crawler/src/controllers/crawl.controller.ts` | `handleCrawl` — Zod validate, SSRF, concurrency, dispatch, 202 |
| Create | `apps/crawler/src/routes/crawl.route.ts` | Thin router — `POST /crawl` → auth middleware → controller |
| Modify | `apps/crawler/src/index.ts` | Wire crawl route, store tracker map, set up pino |

---

## Task 1: Enrich Shared Types

**Files:**
- Modify: `packages/shared/src/types.ts`

- [ ] **Step 1: Add `SessionMetrics` type and enrich `AnalysisResult`**

Replace the contents of `packages/shared/src/types.ts` with:

```typescript
export type TrackerEntry = {
  domain: string;
  owner: string;
  category: string;
  prevalence?: number;
};

export type BlockedRequest = {
  url: string;
  hostname: string;
  tracker: TrackerEntry;
  bytesSaved?: number;
};

export type SessionMetrics = {
  requestCount: number;
  totalBytes: number;
  loadTimeMs: number;
};

export type TrackerOwnerSummary = {
  owner: string;
  category: string;
  requestCount: number;
  domains: string[];
  categories: string[];
};

export type AnalysisResult = {
  url: string;
  finalUrl: string;
  pageTitle: string;
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

export type CrawlRequest = {
  url: string;
  reportId: string;
  callbackUrl: string;
};

export type CrawlCallback =
  | { reportId: string; status: 'done'; data: AnalysisResult }
  | { reportId: string; status: 'error'; error: string };

export type ReportStatus = 'queued' | 'running' | 'done' | 'error';
```

- [ ] **Step 2: Verify shared package builds**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/types.ts
git commit -m "feat(shared): add SessionMetrics, enrich AnalysisResult with per-session data"
```

---

## Task 2: Logger, Errors, and Constants

**Files:**
- Create: `apps/crawler/src/logger.ts`
- Create: `apps/crawler/src/errors/index.ts`
- Modify: `apps/crawler/src/constants/index.ts`

- [ ] **Step 1: Create `logger.ts`**

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env['NODE_ENV'] === 'production' ? 'info' : 'debug',
  transport:
    process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty' }
      : undefined,
});
```

- [ ] **Step 2: Create `errors/index.ts`**

```typescript
export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

export class CrawlTimeoutError extends Error {
  constructor() {
    super('Crawl timed out after 30s');
    this.name = 'CrawlTimeoutError';
  }
}

export class CrawlNavigationError extends Error {
  constructor(cause: string) {
    super(`Navigation failed: ${cause}`);
    this.name = 'CrawlNavigationError';
  }
}
```

- [ ] **Step 3: Update `constants/index.ts`**

Replace with:

```typescript
export const ENV_VALIDATION_MESSAGES = {
  PORT_REQUIRED: 'PORT is required',
  SECRET_REQUIRED: 'CRAWLER_SHARED_SECRET is required',
  CALLBACK_URL_REQUIRED: 'WEB_CALLBACK_URL is required',
  MAX_JOBS_REQUIRED: 'MAX_CONCURRENT_JOBS is required',
} as const;

export const NODE_ENV_VALUES = ['development', 'production', 'test'] as const;

export const CRAWL_TIMEOUT_MS = 30_000;

export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

export const BOT_CHALLENGE_PATTERNS = [
  'just a moment',
  'attention required',
  'access denied',
  'verifying you are human',
  'ddos-guard',
  'cloudflare',
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
```

- [ ] **Step 4: Add vitest as a dev dependency (needed for all test tasks)**

```bash
cd apps/crawler && pnpm add -D vitest
```

Expected: vitest added to `package.json` devDependencies.

- [ ] **Step 5: Verify types check**

```bash
cd apps/crawler && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/crawler/src/logger.ts apps/crawler/src/errors/index.ts apps/crawler/src/constants/index.ts apps/crawler/package.json
git commit -m "feat(crawler): add logger, typed errors, crawl constants, and vitest"
```

---

## Task 3: SSRF Guard

**Files:**
- Create: `apps/crawler/src/security/ssrf-guard.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/crawler/src/security/ssrf-guard.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ssrfGuard } from './ssrf-guard.js';
import { SsrfError } from '../errors/index.js';

describe('ssrfGuard', () => {
  it('rejects non-http/https schemes', async () => {
    await expect(ssrfGuard('ftp://example.com')).rejects.toBeInstanceOf(SsrfError);
  });

  it('rejects localhost', async () => {
    await expect(ssrfGuard('http://localhost/admin')).rejects.toBeInstanceOf(SsrfError);
  });

  it('rejects 127.x.x.x', async () => {
    await expect(ssrfGuard('http://127.0.0.1')).rejects.toBeInstanceOf(SsrfError);
  });

  it('accepts a public URL', async () => {
    await expect(ssrfGuard('https://example.com')).resolves.not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/crawler && npx vitest run src/security/ssrf-guard.test.ts
```

Expected: FAIL — `ssrfGuard` not defined.

- [ ] **Step 3: Implement `ssrf-guard.ts`**

```typescript
import dns from 'dns/promises';
import { SsrfError } from '../errors/index.js';
import { PRIVATE_IP_RANGES } from '../constants/index.js';

export async function ssrfGuard(rawUrl: string): Promise<void> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new SsrfError(`Scheme not allowed: ${parsed.protocol}`);
  }

  let address: string;
  try {
    const result = await dns.lookup(parsed.hostname);
    address = result.address;
  } catch {
    throw new SsrfError(`DNS resolution failed for ${parsed.hostname}`);
  }

  const isPrivate = PRIVATE_IP_RANGES.some((pattern) => pattern.test(address));
  if (isPrivate) {
    throw new SsrfError(`Private IP address not allowed: ${address}`);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/crawler && npx vitest run src/security/ssrf-guard.test.ts
```

Expected: PASS (note: the `localhost` test resolves to `127.0.0.1` which matches the `127.x` pattern).

- [ ] **Step 5: Commit**

```bash
git add apps/crawler/src/security/ssrf-guard.ts apps/crawler/src/security/ssrf-guard.test.ts
git commit -m "feat(crawler): add SSRF guard with DNS lookup and private IP rejection"
```

---

## Task 4: Auth Middleware

**Files:**
- Create: `apps/crawler/src/middleware/auth.middleware.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/crawler/src/middleware/auth.middleware.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth.middleware.js';

vi.mock('../env.js', () => ({
  env: { crawlerSharedSecret: 'test-secret' },
}));

function makeReq(authHeader?: string): Partial<Request> {
  return { headers: { authorization: authHeader } };
}

function makeRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe('authMiddleware', () => {
  it('calls next() when token is correct', () => {
    const next = vi.fn() as NextFunction;
    authMiddleware(makeReq('Bearer test-secret') as Request, makeRes() as unknown as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when token is wrong', () => {
    const res = makeRes();
    const next = vi.fn() as NextFunction;
    authMiddleware(makeReq('Bearer wrong') as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header is missing', () => {
    const res = makeRes();
    const next = vi.fn() as NextFunction;
    authMiddleware(makeReq(undefined) as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/crawler && npx vitest run src/middleware/auth.middleware.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `auth.middleware.ts`**

```typescript
import type { Request, Response, NextFunction } from 'express';
import { env } from '../env.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const expected = `Bearer ${env.crawlerSharedSecret}`;
  if (req.headers.authorization !== expected) {
    res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or missing authorization token' });
    return;
  }
  next();
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/crawler && npx vitest run src/middleware/auth.middleware.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/crawler/src/middleware/auth.middleware.ts apps/crawler/src/middleware/auth.middleware.test.ts
git commit -m "feat(crawler): add Bearer token auth middleware"
```

---

## Task 5: Request Interceptor

**Files:**
- Create: `apps/crawler/src/crawler/request-interceptor.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/crawler/src/crawler/request-interceptor.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createInterceptHandler } from './request-interceptor.js';
import type { TrackerEntry } from '@privacy-diff/shared';

const trackerMap: Record<string, TrackerEntry> = {
  'doubleclick.net': { domain: 'doubleclick.net', owner: 'Google LLC', category: 'Advertising' },
};

describe('createInterceptHandler', () => {
  it('aborts and records when block=true and tracker found', () => {
    const blocked: string[] = [];
    const route = { request: () => ({ url: () => 'https://doubleclick.net/pixel' }), abort: vi.fn(), continue: vi.fn() };
    const handler = createInterceptHandler({ block: true, trackerMap, onBlocked: (r) => blocked.push(r.hostname) });
    handler(route as never);
    expect(route.abort).toHaveBeenCalled();
    expect(route.continue).not.toHaveBeenCalled();
    expect(blocked).toContain('doubleclick.net');
  });

  it('continues when block=false regardless of tracker match', () => {
    const route = { request: () => ({ url: () => 'https://doubleclick.net/pixel' }), abort: vi.fn(), continue: vi.fn() };
    const handler = createInterceptHandler({ block: false, trackerMap, onBlocked: vi.fn() });
    handler(route as never);
    expect(route.continue).toHaveBeenCalled();
    expect(route.abort).not.toHaveBeenCalled();
  });

  it('continues when no tracker match', () => {
    const route = { request: () => ({ url: () => 'https://example.com/img.png' }), abort: vi.fn(), continue: vi.fn() };
    const handler = createInterceptHandler({ block: true, trackerMap, onBlocked: vi.fn() });
    handler(route as never);
    expect(route.continue).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/crawler && npx vitest run src/crawler/request-interceptor.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `request-interceptor.ts`**

```typescript
import type { Route } from 'playwright';
import type { TrackerEntry, BlockedRequest } from '@privacy-diff/shared';
import { lookupTracker } from '@privacy-diff/shared';

interface InterceptOptions {
  block: boolean;
  trackerMap: Record<string, TrackerEntry>;
  onBlocked: (req: BlockedRequest) => void;
}

export function createInterceptHandler(options: InterceptOptions) {
  return (route: Route): void => {
    const url = route.request().url();
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      void route.continue();
      return;
    }

    if (options.block) {
      const tracker = lookupTracker(hostname, options.trackerMap);
      if (tracker) {
        options.onBlocked({
          url: `${new URL(url).hostname}${new URL(url).pathname}`,
          hostname,
          tracker,
        });
        void route.abort();
        return;
      }
    }

    void route.continue();
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/crawler && npx vitest run src/crawler/request-interceptor.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/crawler/src/crawler/request-interceptor.ts apps/crawler/src/crawler/request-interceptor.test.ts
git commit -m "feat(crawler): add request interceptor for tracker blocking"
```

---

## Task 6: Result Builder

**Files:**
- Create: `apps/crawler/src/crawler/result-builder.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/crawler/src/crawler/result-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildResult } from './result-builder.js';
import type { SessionResult } from './session-runner.js';

const baseMetrics = { requestCount: 10, totalBytes: 1000, loadTimeMs: 500 };

const unprotected: SessionResult = {
  finalUrl: 'https://example.com',
  pageTitle: 'Example',
  botDetected: false,
  metrics: { requestCount: 20, totalBytes: 2000, loadTimeMs: 800 },
  blockedList: [],
};

const protectedSession: SessionResult = {
  finalUrl: 'https://example.com',
  pageTitle: 'Example',
  botDetected: false,
  metrics: { requestCount: 12, totalBytes: 1200, loadTimeMs: 600 },
  blockedList: [
    { url: 'doubleclick.net/pixel', hostname: 'doubleclick.net', tracker: { domain: 'doubleclick.net', owner: 'Google LLC', category: 'Advertising' } },
    { url: 'connect.facebook.net/en', hostname: 'connect.facebook.net', tracker: { domain: 'connect.facebook.net', owner: 'Meta Platforms, Inc.', category: 'Social Network' } },
    { url: 'doubleclick.net/ads', hostname: 'doubleclick.net', tracker: { domain: 'doubleclick.net', owner: 'Google LLC', category: 'Advertising' } },
  ],
};

describe('buildResult', () => {
  it('computes diff fields correctly', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', false);
    expect(result.blockedRequests).toBe(3);
    expect(result.bytesSaved).toBe(800);
    expect(result.loadTimeSavedMs).toBe(200);
    expect(result.totalRequests).toBe(20);
  });

  it('groups byOwner correctly', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', false);
    const google = result.byOwner.find((o) => o.owner === 'Google LLC');
    expect(google?.requestCount).toBe(2);
    expect(google?.domains).toContain('doubleclick.net');
    expect(google?.categories).toContain('Advertising');
  });

  it('aggregates categories correctly', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', false);
    expect(result.categories['Advertising']).toBe(2);
    expect(result.categories['Social Network']).toBe(1);
  });

  it('clamps negative bytesSaved to 0', () => {
    const result = buildResult(protectedSession, unprotected, 'https://example.com', false);
    expect(result.bytesSaved).toBe(0);
    expect(result.loadTimeSavedMs).toBe(0);
  });

  it('sets partial flag', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', true);
    expect(result.partial).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/crawler && npx vitest run src/crawler/result-builder.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `result-builder.ts`**

```typescript
import type { AnalysisResult, TrackerOwnerSummary } from '@privacy-diff/shared';
import type { SessionResult } from './session-runner.js';

export function buildResult(
  unprotected: SessionResult,
  protectedSession: SessionResult,
  url: string,
  partial: boolean,
): AnalysisResult {
  const bytesSaved = Math.max(0, unprotected.metrics.totalBytes - protectedSession.metrics.totalBytes);
  const loadTimeSavedMs = Math.max(0, unprotected.metrics.loadTimeMs - protectedSession.metrics.loadTimeMs);

  const ownerMap = new Map<string, TrackerOwnerSummary>();
  for (const req of protectedSession.blockedList) {
    const { owner, category } = req.tracker;
    const existing = ownerMap.get(owner);
    if (existing) {
      existing.requestCount += 1;
      if (!existing.domains.includes(req.hostname)) existing.domains.push(req.hostname);
      if (!existing.categories.includes(category)) existing.categories.push(category);
    } else {
      ownerMap.set(owner, { owner, category, requestCount: 1, domains: [req.hostname], categories: [category] });
    }
  }
  const byOwner = [...ownerMap.values()].sort((a, b) => b.requestCount - a.requestCount);

  const categories: Record<string, number> = {};
  for (const req of protectedSession.blockedList) {
    const cat = req.tracker.category;
    categories[cat] = (categories[cat] ?? 0) + 1;
  }

  return {
    url,
    finalUrl: protectedSession.finalUrl,
    pageTitle: protectedSession.pageTitle,
    partial,
    unprotected: unprotected.metrics,
    protected: protectedSession.metrics,
    totalRequests: unprotected.metrics.requestCount,
    blockedRequests: protectedSession.blockedList.length,
    bytesSaved,
    loadTimeSavedMs,
    blocked: protectedSession.blockedList,
    byOwner,
    categories,
    crawledAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/crawler && npx vitest run src/crawler/result-builder.test.ts
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/crawler/src/crawler/result-builder.ts apps/crawler/src/crawler/result-builder.test.ts
git commit -m "feat(crawler): add result builder — sessions → AnalysisResult"
```

---

## Task 7: Session Runner

**Files:**
- Create: `apps/crawler/src/crawler/session-runner.ts`

Note: This module uses Playwright directly — unit tests mock the browser. Integration is verified manually with test URLs from the spec.

- [ ] **Step 1: Define the `SessionResult` type and implement `session-runner.ts`**

```typescript
import type { Browser } from 'playwright';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { TrackerEntry, BlockedRequest, SessionMetrics } from '@privacy-diff/shared';
import { createInterceptHandler } from './request-interceptor.js';
import { CrawlTimeoutError, CrawlNavigationError } from '../errors/index.js';
import { CRAWL_TIMEOUT_MS, BOT_CHALLENGE_PATTERNS } from '../constants/index.js';

chromium.use(StealthPlugin());

export type SessionResult = {
  finalUrl: string;
  pageTitle: string;
  botDetected: boolean;
  metrics: SessionMetrics;
  blockedList: BlockedRequest[];
};

const ZERO_METRICS: SessionMetrics = { requestCount: 0, totalBytes: 0, loadTimeMs: 0 };

export async function runSession(
  browser: Browser,
  url: string,
  options: { block: boolean },
  trackerMap: Record<string, TrackerEntry>,
): Promise<SessionResult> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  const blockedList: BlockedRequest[] = [];
  let requestCount = 0;
  let totalBytes = 0;

  await page.route(
    '**/*',
    createInterceptHandler({
      block: options.block,
      trackerMap,
      onBlocked: (req) => blockedList.push(req),
    }),
  );

  page.on('request', () => { requestCount += 1; });
  page.on('response', (response) => {
    const length = parseInt(response.headers()['content-length'] ?? '0', 10);
    totalBytes += isNaN(length) ? 0 : length;
  });

  const startTime = Date.now();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CRAWL_TIMEOUT_MS });
  } catch (err) {
    await context.close();
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Timeout') || message.includes('timeout')) {
      throw new CrawlTimeoutError();
    }
    throw new CrawlNavigationError(message);
  }

  const loadTimeMs = Date.now() - startTime;
  const finalUrl = page.url();
  const pageTitle = await page.title();

  const titleLower = pageTitle.toLowerCase();
  const botDetected = BOT_CHALLENGE_PATTERNS.some((pattern) => titleLower.includes(pattern));

  await context.close();

  return {
    finalUrl,
    pageTitle,
    botDetected,
    metrics: { requestCount, totalBytes, loadTimeMs },
    blockedList,
  };
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/crawler && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/crawler/src/crawler/session-runner.ts
git commit -m "feat(crawler): add session runner — Playwright context, stealth, intercept, metrics"
```

---

## Task 8: Callback Service

**Files:**
- Create: `apps/crawler/src/services/callback.service.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/crawler/src/services/callback.service.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendCallback } from './callback.service.js';

vi.mock('../env.js', () => ({ env: { crawlerSharedSecret: 'test-secret' } }));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('sendCallback', () => {
  beforeEach(() => mockFetch.mockReset());

  it('sends POST with correct headers on success', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    await sendCallback('https://web.app/callback', { reportId: 'r1', status: 'error', error: 'timeout' });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://web.app/callback',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-secret' }),
      }),
    );
  });

  it('retries up to 3 times on failure then resolves without throwing', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    await expect(sendCallback('https://web.app/callback', { reportId: 'r1', status: 'error', error: 'x' })).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('succeeds on second attempt without exhausting retries', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({ ok: true, status: 200 });
    await sendCallback('https://web.app/callback', { reportId: 'r1', status: 'error', error: 'x' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/crawler && npx vitest run src/services/callback.service.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `callback.service.ts`**

```typescript
import type { CrawlCallback } from '@privacy-diff/shared';
import { env } from '../env.js';
import { logger } from '../logger.js';
import { RETRY_DELAYS_MS } from '../constants/index.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendCallback(callbackUrl: string, payload: CrawlCallback): Promise<void> {
  const hostname = (() => {
    try { return new URL(callbackUrl).hostname; } catch { return 'unknown'; }
  })();

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.crawlerSharedSecret}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.info({ reportId: payload.reportId, status: payload.status }, 'Callback delivered');
        return;
      }

      logger.warn({ reportId: payload.reportId, attempt: attempt + 1, httpStatus: response.status, callbackHost: hostname }, 'Callback failed, retrying');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ reportId: payload.reportId, attempt: attempt + 1, error: message, callbackHost: hostname }, 'Callback error, retrying');
    }

    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  logger.error({ reportId: payload.reportId, callbackHost: hostname }, 'Callback failed after all retries');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd apps/crawler && npx vitest run src/services/callback.service.test.ts
```

Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/crawler/src/services/callback.service.ts apps/crawler/src/services/callback.service.test.ts
git commit -m "feat(crawler): add callback service with 3-retry exponential backoff"
```

---

## Task 9: Crawl Service (Orchestrator)

**Files:**
- Create: `apps/crawler/src/services/crawl.service.ts`

- [ ] **Step 1: Implement `crawl.service.ts`**

```typescript
import type { TrackerEntry } from '@privacy-diff/shared';
import { launchBrowser, runSession } from '../crawler/session-runner.js';
import { buildResult } from '../crawler/result-builder.js';
import { sendCallback } from './callback.service.js';
import { logger } from '../logger.js';
import { env } from '../env.js';
import type { SessionResult } from '../crawler/session-runner.js';

let activeJobs = 0;

export function getActiveJobs(): number {
  return activeJobs;
}

const ZERO_SESSION: SessionResult = {
  finalUrl: '',
  pageTitle: '',
  botDetected: false,
  metrics: { requestCount: 0, totalBytes: 0, loadTimeMs: 0 },
  blockedList: [],
};

export async function executeCrawl(
  url: string,
  reportId: string,
  callbackUrl: string,
  trackerMap: Record<string, TrackerEntry>,
): Promise<void> {
  activeJobs += 1;
  const browser = await launchBrowser();

  try {
    const [unprotectedResult, protectedResult] = await Promise.allSettled([
      runSession(browser, url, { block: false }, trackerMap),
      runSession(browser, url, { block: true }, trackerMap),
    ]);

    const bothFailed = unprotectedResult.status === 'rejected' && protectedResult.status === 'rejected';
    if (bothFailed) {
      const error = unprotectedResult.reason instanceof Error ? unprotectedResult.reason.message : 'Both sessions failed';
      logger.error({ reportId, error }, 'Both crawl sessions failed');
      await sendCallback(callbackUrl, { reportId, status: 'error', error });
      return;
    }

    const partial = unprotectedResult.status === 'rejected' || protectedResult.status === 'rejected';
    const unprotected = unprotectedResult.status === 'fulfilled' ? unprotectedResult.value : ZERO_SESSION;
    const protectedSession = protectedResult.status === 'fulfilled' ? protectedResult.value : ZERO_SESSION;

    if (unprotected.botDetected || protectedSession.botDetected) {
      logger.warn({ reportId }, 'Bot challenge detected during crawl');
      await sendCallback(callbackUrl, { reportId, status: 'error', error: 'Site blocked automated browsing' });
      return;
    }

    const data = buildResult(unprotected, protectedSession, url, partial);
    logger.info({ reportId, blockedRequests: data.blockedRequests, partial }, 'Crawl complete');
    await sendCallback(callbackUrl, { reportId, status: 'done', data });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unexpected error';
    logger.error({ reportId, error }, 'Crawl service error');
    await sendCallback(callbackUrl, { reportId, status: 'error', error });
  } finally {
    await browser.close();
    activeJobs -= 1;
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/crawler && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/crawler/src/services/crawl.service.ts
git commit -m "feat(crawler): add crawl service — browser orchestration, sessions, result, callback"
```

---

## Task 10: Controller, Router, and Express Wiring

**Files:**
- Create: `apps/crawler/src/controllers/crawl.controller.ts`
- Create: `apps/crawler/src/routes/crawl.route.ts`
- Modify: `apps/crawler/src/index.ts`

- [ ] **Step 1: Write the failing controller test**

Create `apps/crawler/src/controllers/crawl.controller.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../services/crawl.service.js', () => ({ executeCrawl: vi.fn(), getActiveJobs: vi.fn(() => 0) }));
vi.mock('../security/ssrf-guard.js', () => ({ ssrfGuard: vi.fn() }));
vi.mock('../env.js', () => ({ env: { maxConcurrentJobs: 3 } }));

import { handleCrawl } from './crawl.controller.js';
import { executeCrawl, getActiveJobs } from '../services/crawl.service.js';
import { ssrfGuard } from '../security/ssrf-guard.js';
import { SsrfError } from '../errors/index.js';

function makeReqRes(body: unknown) {
  const req = { body, app: { locals: { trackerMap: {} } } } as unknown as Request;
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return { req, res };
}

describe('handleCrawl', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 202 for valid request', async () => {
    vi.mocked(ssrfGuard).mockResolvedValue(undefined);
    vi.mocked(getActiveJobs).mockReturnValue(0);
    const { req, res } = makeReqRes({ url: 'https://example.com', reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(202);
    expect(executeCrawl).toHaveBeenCalled();
  });

  it('returns 400 for missing url', async () => {
    const { req, res } = makeReqRes({ reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(400);
  });

  it('returns 400 on SSRF rejection', async () => {
    vi.mocked(ssrfGuard).mockRejectedValue(new SsrfError('private IP'));
    const { req, res } = makeReqRes({ url: 'http://192.168.1.1', reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(400);
  });

  it('returns 503 when at concurrency cap', async () => {
    vi.mocked(ssrfGuard).mockResolvedValue(undefined);
    vi.mocked(getActiveJobs).mockReturnValue(3);
    const { req, res } = makeReqRes({ url: 'https://example.com', reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(503);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd apps/crawler && npx vitest run src/controllers/crawl.controller.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `crawl.controller.ts`**

```typescript
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { TrackerEntry } from '@privacy-diff/shared';
import { ssrfGuard } from '../security/ssrf-guard.js';
import { executeCrawl, getActiveJobs } from '../services/crawl.service.js';
import { SsrfError } from '../errors/index.js';
import { env } from '../env.js';
import { logger } from '../logger.js';

const CrawlBodySchema = z.object({
  url: z.string().url({ message: 'url must be a valid URL' }),
  reportId: z.string().min(1, { message: 'reportId is required' }),
  callbackUrl: z.string().url({ message: 'callbackUrl must be a valid URL' }),
});

export async function handleCrawl(req: Request, res: Response): Promise<void> {
  const parsed = CrawlBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { url, reportId, callbackUrl } = parsed.data;

  try {
    await ssrfGuard(url);
  } catch (err) {
    if (err instanceof SsrfError) {
      res.status(400).json({ code: 'SSRF_REJECTED', message: err.message });
      return;
    }
    res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected error during URL validation' });
    return;
  }

  if (getActiveJobs() >= env.maxConcurrentJobs) {
    res.status(503).json({ code: 'CAPACITY_EXCEEDED', message: 'Crawler is at capacity, retry later' });
    return;
  }

  const trackerMap = req.app.locals['trackerMap'] as Record<string, TrackerEntry>;
  logger.info({ reportId }, 'Crawl job accepted');

  void executeCrawl(url, reportId, callbackUrl, trackerMap);

  res.status(202).json({ reportId, status: 'accepted' });
}
```

- [ ] **Step 4: Implement `routes/crawl.route.ts`**

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { handleCrawl } from '../controllers/crawl.controller.js';

const router = Router();

router.post('/crawl', authMiddleware, handleCrawl);

export default router;
```

- [ ] **Step 5: Update `index.ts`**

Replace the contents of `apps/crawler/src/index.ts`:

```typescript
import 'dotenv/config';
import express from 'express';
import { env } from './env.js';
import { logger } from './logger.js';
import { loadTrackerMap } from './tracker-map-loader.js';
import crawlRouter from './routes/crawl.route.js';

const app = express();
app.use(express.json());

const trackerMap = loadTrackerMap();
app.locals['trackerMap'] = trackerMap;

app.use(crawlRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Crawler service started');
});
```

- [ ] **Step 6: Run controller tests**

```bash
cd apps/crawler && npx vitest run src/controllers/crawl.controller.test.ts
```

Expected: PASS — all 4 tests green.

- [ ] **Step 7: Verify full TypeScript build**

```bash
cd apps/crawler && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/crawler/src/controllers/ apps/crawler/src/routes/ apps/crawler/src/index.ts
git commit -m "feat(crawler): wire controller, router, and Express app — POST /crawl live"
```

---

## Task 11: Lint, Build, and Manual Smoke Test

- [ ] **Step 1: Run lint across the monorepo**

```bash
npm run lint
```

Expected: no errors. Fix any lint issues before proceeding.

- [ ] **Step 2: Run full build**

```bash
npm run build
```

Expected: all packages compile cleanly.

- [ ] **Step 3: Run all tests**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 4: Start the crawler locally and smoke test**

In one terminal:
```bash
cd apps/crawler && cp ../../.env.example .env  # fill in real values
npm run dev
```

In another terminal (replace tokens with your actual values):
```bash
curl -s -X POST http://localhost:3001/crawl \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","reportId":"test-001","callbackUrl":"https://webhook.site/your-id"}' \
  | jq .
```

Expected: `{"reportId":"test-001","status":"accepted"}` within 100ms.

Check webhook.site (or your callback URL) for the `CrawlCallback` payload within 30s.

- [ ] **Step 5: Test SSRF rejection**

```bash
curl -s -X POST http://localhost:3001/crawl \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"url":"http://192.168.1.1","reportId":"ssrf-test","callbackUrl":"https://webhook.site/your-id"}' \
  | jq .
```

Expected: `{"code":"SSRF_REJECTED","message":"Private IP address not allowed: 192.168.1.1"}`

- [ ] **Step 6: Update build plan**

In `01-BUILD-PLAN.md`, change `- [ ] **Spec 03**` to `- [x] **Spec 03**` and add a note:

```
_notes: Layered Router→Controller→Service architecture; async webhook callback; dual Playwright sessions with stealth; SSRF guard; concurrency cap; AnalysisResult enriched with per-session SessionMetrics._
```

- [ ] **Step 7: Commit**

```bash
git add 01-BUILD-PLAN.md
git commit -m "chore(tracker): update build plan for spec 03"
```
