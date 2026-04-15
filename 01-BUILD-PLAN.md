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
- [ ] **Spec 05** — API routes work end-to-end — _notes:_

### Frontend
- [ ] **Spec 06** — Homepage + analyze flow + loading state — _notes:_
- [ ] **Spec 07** — Report page renders all sections — _notes:_

### Ship
- [ ] **Spec 08** — Deployed to Railway (web + crawler + Postgres) — _notes:_
- [ ] **Spec 09** — README, demo GIF, Loom video — _notes:_

## Decision Log

> Append decisions here as you make them — Cursor especially should log when it deviates from a spec and why.

- 2026-04-15 — Used android-tds.json instead of web TDS: web URLs inaccessible (403/404), android-tds is official DDG data with 3,092 entries. Fallback path per Spec 02 risk assessment. — Cursor

## Known Issues / Cuts

> If you have to cut something, log it here so it lands in the README's "v2" section.

- _Example: Skipped screenshot diff to save time; planned for v2._

## Acceptance for "Done"

The POC is shippable when ALL of:
- [ ] You can paste 5 different real-world URLs and get reports in <60s each
- [ ] Reports are accessible via shareable URL after closing the tab
- [ ] Repeat analysis of the same URL within a week returns instantly (cache hit)
- [ ] Homepage and report pages are mobile-responsive
- [ ] README explains DDG tie-in clearly with links to `tracker-radar`
- [ ] Live demo URL works from a phone, fresh browser, no errors
