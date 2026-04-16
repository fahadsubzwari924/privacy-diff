# Build Plan & Progress Tracker

> **Cursor: update this file after completing each spec.** Change `[ ]` to `[x]` and add a one-line note.

## Phase Goals

| Hour | Goal | Spec(s) |
|---|---|---|
| 0–1 | Project skeleton + Tracker Radar ingested | 01, 02 |
| 1–2 | Crawler service returns real diff data | 03 |
| 2–3 | **End-to-end working slice** (ugly UI, real data) | 04, 05, 06 |
| 3–4 | Persistence + shareable report URLs | 04, 05 |
| 4–5 | Polished report page (charts, screenshots, CTA) | 07 |
| 5–6 | Deploy + README + polish | 08, 09 |

## Progress Checklist

### Setup
- [x] **Spec 01** — Project setup (monorepo, deps, env) — _notes:_
- [x] **Spec 02** — Tracker Radar data ingested and queryable — _notes: DuckDuckGo android-tds.json fetched at build time, 3,092 tracker entries normalized into O(1) lookup map, shared package exports lookupTracker() with suffix-matching_

### Backend
- [x] **Spec 03** — Crawler service runs diff and returns JSON — _notes: Express.js service with POST /crawl, dual Playwright sessions (protected + unprotected), tracker blocking via request interception, webhook callbacks with exponential backoff, SSRF protection, concurrency limits, 27/27 unit tests passing_
- [x] **Spec 04** — Postgres schema created, reports persist — _notes: Drizzle 0.45 + postgres driver; reports table with cache index (url_hash, week_bucket); report-repository layer isolates all DB calls; url-normalizer, slug-generator, week-bucket utilities; committed SQL migration in src/db/migrations/; 26/26 unit tests passing_
- [x] **Spec 05** — API routes work end-to-end — _notes: All 9 ACs verified manually + 57 unit tests passing. POST /api/analyze (cache-check, rate-limit, crawler dispatch), GET /api/report/:id (full/pending serialize), GET /api/report/:id/status (narrow query), POST /api/report-callback (auth, result mapping). Blockers fixed: rate-limit insert before createReport (no orphans), removed running status set (no overwrite), null IP handling skips enforcement. Crawler crash fix: browser.close() errors wrapped, launchBrowser() caught. Code review: 12/12 issues addressed._

### Frontend
- [x] **Spec 06** — Homepage + analyze flow + loading state — _notes: shadcn v4 (base-nova/neutral) installed manually due to pnpm workspace resolver conflict with shadcn's built-in pnpm add; Button, Input, Card, Sonner components generated; AnalyzeForm client component with useReducer + 5-state discriminated union, prepareUrl() on submit, example chips, toasts for rate-limit/server-error; server shell page.tsx with hero/how-it-works/footer; minimal /r/[id] shell for end-to-end routing; dark mode stripped._
- [x] **Spec 07** — Report page renders all sections — _notes: Full report page with hero-stat, metrics-compare, category-chart (CSS-based), company-list, share-button, download-cta, OG image. DualScanView loading state with dual simulated browser panes, rubber-band progress bar, fake request feed, and reveal animation with blocked-count counter. Shared SiteHeader/SiteFooter components extracted. All hard-coded strings moved to constants. Homepage quick-links updated to copilot.cloud.microsoft, flippa.com, omnicalculator.com with hostname labels._

### Ship
- [x] **Spec 08** — Deployed to Railway (web + crawler + Postgres) — _notes: Docker approach — Dockerfile.web (Next.js standalone, 2-stage), Dockerfile.crawler (playwright:v1.59.1-jammy runtime, pnpm deploy), docker-compose.yml for local testing, .dockerignore, programmatic migrate.ts (CJS, drizzle-orm/migrator), outputFileTracingRoot for monorepo standalone, web start command runs migrations then server. Runtime fixes: playwright image v1.44→v1.59.1, INTERNAL_URL for Docker-internal callback routing, DualScanView error+timeout handling. Build fix: placeholder env vars (DATABASE_URL, CRAWLER_URL, CRAWLER_SHARED_SECRET, PUBLIC_BASE_URL) during next build so Zod validation passes._
- [ ] **Spec 09** — README, demo GIF, Loom video — _notes:_

## Decision Log

> Append decisions here as you make them — Cursor especially should log when it deviates from a spec and why.

- 2026-04-15 — Used android-tds.json instead of web TDS: web URLs inaccessible (403/404), android-tds is official DDG data with 3,092 entries. Fallback path per Spec 02 risk assessment. — Cursor

## Known Issues / Cuts

> If you have to cut something, log it here so it lands in the README's "v2" section.

- Concurrent submissions: two simultaneous `POST /api/analyze` requests for the same URL within the same week bucket will both miss the cache check and create separate report rows (different slugs due to random suffix). Both will dispatch to the crawler. The result is duplicate work, not data corruption. Fix in v2: add a `UNIQUE` constraint on `(url_hash, week_bucket)` with `INSERT ... ON CONFLICT DO NOTHING` + return the existing row's id.

## Acceptance for "Done"

The POC is shippable when ALL of:
- [ ] You can paste 5 different real-world URLs and get reports in <60s each
- [ ] Reports are accessible via shareable URL after closing the tab
- [ ] Repeat analysis of the same URL within a week returns instantly (cache hit)
- [ ] Homepage and report pages are mobile-responsive
- [ ] README explains DDG tie-in clearly with links to `tracker-radar`
- [ ] Live demo URL works from a phone, fresh browser, no errors
