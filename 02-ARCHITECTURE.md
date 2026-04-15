# Architecture

## System Diagram

```
                          ┌─────────────── Railway Project ───────────────┐
┌─────────────┐  HTTPS    │  ┌──────────────────────┐                     │
│   Browser   │──────────▶│  │   web service        │                     │
│   (User)    │           │  │   (Next.js, public)  │                     │
└─────────────┘           │  │  - UI pages          │                     │
                          │  │  - /api/analyze      │   private network   │
                          │  │  - /api/report/:id   │◀───────────────────┐│
                          │  │  - /r/:slug page     │─────────┐          ││
                          │  └──────────┬───────────┘         ▼          ││
                          │             │              ┌──────────────┐  ││
                          │             │ SQL          │  crawler     │──┘│
                          │             ▼              │  service     │   │
                          │  ┌──────────────────────┐  │  (private)   │   │
                          │  │   Postgres plugin    │  │  - Express   │   │
                          │  │   (reports table)    │  │  - Playwright│   │
                          │  └──────────────────────┘  └──────────────┘   │
                          └────────────────────────────────────────────────┘
```

Internal hostnames (Railway DNS): `crawler.railway.internal:8080`, `web.railway.internal:3000`. Crawler has no public domain.

## Request Flow: New Analysis

```
User pastes URL
   │
   ▼
POST /api/analyze { url }
   │
   ├─▶ Validate URL (scheme, no private IPs)
   ├─▶ Hash URL, check cache (Postgres) for current week
   │     └─▶ HIT  → return existing reportId immediately
   │     └─▶ MISS → continue
   │
   ├─▶ Insert report row (status=running)
   ├─▶ Call crawler: POST /crawl { url, reportId }
   │     │  (returns immediately; crawler works async)
   │     │
   │     │  Crawler runs:
   │     │   1. Launch 2 Playwright contexts in parallel
   │     │   2. Context A: no blocking, record requests
   │     │   3. Context B: block any host in tracker map
   │     │   4. Compute diff, look up companies
   │     │   5. POST /api/report-callback { reportId, data }
   │     ▼
   │  Webhook updates report row (status=done)
   │
   └─▶ Return { reportId } to user
        │
        ▼
   User polls GET /api/report/:id/status
        └─▶ done → redirect to /r/:slug
```

## Key Design Decisions

| Decision | Why |
|---|---|
| Two services on one Railway project | Web (Next.js) and crawler need very different runtimes — Playwright needs ~1GB RAM and a persistent process; web is light. Separate services let us scale and fail them independently while still sharing internal networking and one bill. |
| Crawler is webhook-style, not request/response | Crawls take 20–40s. Holding HTTP connections that long is fragile. Fire-and-forget + callback is robust. Inside Railway's private network the callback is just `http://web.railway.internal:3000/api/report-callback`. |
| Cache by `(url_hash, week_bucket)` | Tracker landscape doesn't change daily. Weekly granularity is plenty, kills cost on viral hits. |
| Tracker Radar bundled at build time, not fetched | ~30K domains, ~10MB JSON. Fetching at runtime adds latency and a failure mode. Redeploy weekly to refresh. |
| No queue (BullMQ/Redis) for v1 | Adds infra. Crawler runs jobs in-process; cap concurrent jobs to 3. Add a queue only if needed post-launch. |
| Slug = `{hostname-slug}-{6char-hash}` | Human-readable + collision-safe. E.g., `cnn-com-a1b2c3`. |
| No auth | Matches DDG ethos; nothing to protect; one less thing to build. |
| Shared screenshots stored in Cloudflare R2 (or skipped for v1) | If time-constrained, drop screenshots; numbers tell the story. |

## Data Flow: Tracker Lookup

```
Playwright intercepts request to:  https://www.google-analytics.com/collect?...
                                                    │
                                                    ▼
                              extract hostname:  google-analytics.com
                                                    │
                                                    ▼
                                trackerMap.get('google-analytics.com')
                                                    │
                                                    ▼
                          { owner: 'Google LLC', category: 'Analytics',
                            prevalence: 0.42, fingerprinting: 1 }
                                                    │
                                                    ▼
                                If found → BLOCK + record
                                If not   → ALLOW + record (untracked third-party)
```

Hostname matching is **suffix-based**: `foo.bar.google-analytics.com` matches `google-analytics.com`. Walk parent domains until match or root.

## Failure Modes & Handling

| Failure | Behavior |
|---|---|
| URL is malformed | 400, clear error message |
| URL points to private IP / localhost | 400, "we don't analyze internal addresses" |
| Site requires login (returns small HTML) | Show report anyway with note: "page may require login" |
| Site blocks bots | Report fails gracefully: "this site blocks automated browsers" |
| Crawl exceeds 30s | Kill, mark report as `error`, surface friendly message |
| Crawler service down | API returns 503 with retry hint; report row stays in `queued` |
| DB down | API returns 503 |

## Security Notes

- **SSRF prevention:** allowlist scheme `http`/`https`; reject if hostname resolves to private IP ranges (10.x, 172.16–31, 192.168.x, 127.x, IPv6 equivalents). Use `dns.lookup` and check before passing to Playwright.
- **Rate limit:** simple in-memory or Postgres-based limit, e.g., 10 analyses per IP per hour for v1.
- **No user-supplied JS executes anywhere** in our infra.
- **Don't log full URLs with query strings** — strip query params before logging.
