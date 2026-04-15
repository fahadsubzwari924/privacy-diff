# Spec 05 — API Routes (Next.js)

## Business Context
The web app's API layer orchestrates: cache lookup, crawler dispatch, callback intake, status polling.

## Technical Context
Next.js 15 App Router route handlers in `apps/web/src/app/api/`. All bodies validated with Zod.

## Endpoints

### `POST /api/analyze`
**Purpose:** Start a new analysis OR return a cached one.

**Body:** `{ url: string }`

**Logic:**
1. Validate URL with Zod (must be http/https, max 2000 chars).
2. Normalize, hash, get current week bucket.
3. **Cache check:** SELECT report by `(url_hash, week_bucket)` where `status='done'`.
   - HIT → return `{ reportId: existing.id, cached: true }` (200)
4. **Rate limit check:** count rows for this IP in last hour; reject if >10.
5. Generate slug, insert row with `status='queued'`.
6. Fire-and-forget POST to crawler `/crawl` with `{ reportId, url }` and shared secret.
7. Return `{ reportId: slug, cached: false }` (202).

**Errors:**
- 400 invalid URL
- 400 private/internal address
- 429 rate limited
- 503 crawler unreachable (after first attempt)

### `GET /api/report/:id`
**Purpose:** Fetch full report data (for client-side hydration if needed; the page is mainly server-rendered).

**Returns:** Full report row, or 404. If `status !== 'done'`, returns minimal data + status.

### `GET /api/report/:id/status`
**Purpose:** Lightweight polling endpoint.

**Returns:** `{ status: 'queued' | 'running' | 'done' | 'error', error?: string }`

### `POST /api/report-callback`
**Purpose:** Crawler webhook target.

**Auth:** `Authorization: Bearer ${CRAWLER_SHARED_SECRET}` — reject 401 if missing/wrong.

**Body:** Zod-validated `CrawlResult` shape (or error shape).

**Logic:**
1. Verify shared secret.
2. UPDATE row by `id = reportId` with all metrics + `status='done'`.
3. On error payload, set `status='error'`, store `error` message.
4. Return 200.

### `GET /r/:slug` (page, not API)
**Covered in spec 07** — server-rendered report page.

## Implementation Notes

- Use `revalidate: 0` on dynamic routes; reports are mutable until done.
- Use `cache: 'no-store'` in fetch calls.
- All input parsed with Zod before touching DB.
- Log structured (pino) with reportId; never log raw URLs with query strings.

## Crawler Dispatch Helper

```ts
// apps/web/src/lib/crawler.ts
export async function dispatchCrawl(reportId: string, url: string) {
  try {
    await fetch(`${process.env.CRAWLER_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRAWLER_SHARED_SECRET}`,
      },
      body: JSON.stringify({ reportId, url }),
    });
  } catch (e) {
    // Mark report as error so user gets feedback
    await db.update(reports).set({ status: 'error', error: 'crawler unreachable' }).where(eq(reports.id, reportId));
  }
}
```

Don't `await` this in `/api/analyze` if you can avoid it; use `waitUntil` from `next/server` for fire-and-forget if available, otherwise `void dispatchCrawl(...)`.

## Acceptance Criteria
- [ ] `POST /api/analyze` with valid URL returns reportId in <1s
- [ ] Same URL within same week returns cached reportId instantly
- [ ] Invalid URL returns 400 with helpful message
- [ ] Internal IP (e.g. `http://127.0.0.1`) returns 400
- [ ] Rate limit kicks in at 11th request from same IP within an hour
- [ ] `GET /api/report/:id/status` returns correct state during a real crawl
- [ ] Callback with wrong secret returns 401
- [ ] Callback with valid payload updates the row and `status` becomes `done`
- [ ] End-to-end: analyze → poll → done in <60s for a real site

## Notes for Cursor
- Use a tiny `ratelimit.ts` helper with a Postgres-based counter — no Redis needed for v1
- After completing: update `01-BUILD-PLAN.md`.
