# Privacy Diff — Product Overview

> **Read this first.** This is the entry document. After reading, follow the build plan in `01-BUILD-PLAN.md` and implement specs in `specs/` in order.

---

## 1. Problem Statement

Privacy is **abstract**. When DuckDuckGo says "we block trackers," users nod but don't *feel* it. Three concrete problems exist:

1. **End users** can't see what they're being protected from, or show non-technical friends why DDG matters.
2. **Site owners** don't know which third-party scripts pull their site into the surveillance ecosystem.
3. **Journalists & researchers** have no easy, citable tool to quantify tracking on a given site.

DuckDuckGo publishes the [Tracker Radar dataset](https://github.com/duckduckgo/tracker-radar) on GitHub — but it's invisible to normal humans.

## 2. Solution

**Privacy Diff** is a web app: paste any URL → we load it twice in parallel (with and without DDG's tracker blocking) → return a shareable report showing exactly what was blocked, who was watching, and what it cost the page.

Think *Lighthouse, but for surveillance.*

## 3. Core User Journey

1. User lands on homepage, sees one input: *"See who's watching you on any site."*
2. Pastes URL, clicks **Analyze**.
3. Loading screen (~20–40s): *"Loading unprotected... Loading protected... Comparing..."*
4. Lands on a report page with:
   - Hero stat: *"37 trackers blocked. 12 companies were watching you."*
   - Side-by-side metrics: requests, bytes, load time
   - Company breakdown (Google, Meta, etc.) with categories
   - Side-by-side screenshots
   - **CTA: Download DuckDuckGo Browser**
   - Share button (persistent URL: `/r/cnn-com-{hash}`)

## 4. Scope

### In Scope (v1 / 6-hour POC)
- Single URL input, public sites only
- Two-headless-browser diff using Tracker Radar data
- Persistent shareable report URLs
- Caching (1 report per URL per week)
- DDG download CTA
- Mobile-responsive report page

### Out of Scope (v1)
- User accounts, login, history
- Browser extension
- Authenticated/logged-in page analysis
- Comparison vs other browsers (Brave, Firefox)
- Real-time progress beyond simple polling
- Embed badges (mention as v2 in README)

## 5. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui | Fast, polished, runs anywhere as a Node server |
| Charts | Recharts | Drop-in, sane defaults |
| API | Next.js route handlers | One repo, no extra service for simple routes |
| Crawler | Separate Node + Express + Playwright service | Different runtime needs (RAM-heavy, long-running); deployed as its own Railway service |
| Database | Railway Postgres (managed plugin) | Lives in same project as services; one bill |
| Tracker data | Bundled JSON from DDG `tracker-radar` repo | O(1) lookup, no runtime fetch |
| Hosting | Railway (web + crawler + Postgres) | One platform, internal networking, no cold starts, simpler for a POC |
| Domain | `privacydiff.app` (or similar) | Real URL signals seriousness |

**Repo layout:** monorepo with two packages — `apps/web` (Next.js) and `apps/crawler` (Express + Playwright). Use pnpm workspaces.

## 6. Success Criteria for the POC

- ✅ Live deployed URL anyone can visit
- ✅ Successfully analyzes 5+ major sites (cnn.com, nytimes.com, amazon.com, etc.)
- ✅ Reports are shareable (persistent URLs)
- ✅ README clearly explains DDG tie-in and uses their open data
- ✅ Loom video demo, ~60 seconds

## 7. Documents in This Package

Read and implement in this order:

| File | Purpose |
|---|---|
| `00-PRODUCT-OVERVIEW.md` | This file |
| `01-BUILD-PLAN.md` | Hour-by-hour execution plan, progress tracking |
| `02-ARCHITECTURE.md` | System diagram, data flow, key decisions |
| `specs/01-project-setup.md` | Monorepo, dependencies, env config |
| `specs/02-tracker-data.md` | Ingest Tracker Radar, build lookup |
| `specs/03-crawler-service.md` | Playwright service, the diff logic |
| `specs/04-database.md` | Postgres schema, persistence |
| `specs/05-api-routes.md` | Next.js API endpoints |
| `specs/06-frontend-home.md` | Homepage + input + loading states |
| `specs/07-frontend-report.md` | Report page with all visualizations |
| `specs/08-deployment.md` | Railway-only deployment (web + crawler + Postgres) |
| `specs/09-readme-and-polish.md` | The README that closes the job |

Each spec has: business context, technical context, implementation steps, acceptance criteria. Mark progress in `01-BUILD-PLAN.md` as you go.

## 8. Guiding Principles (for Cursor & you)

1. **Ship a working end-to-end slice by hour 3.** Even if ugly. Polish later.
2. **Cache aggressively.** One Playwright crawl per URL per week, max.
3. **No accounts, no tracking.** Match DDG ethos. Use Plausible or no analytics.
4. **Privacy-first errors.** Never log full URLs with query params; hash them.
5. **Cut features, not quality.** If running late, drop screenshots before charts; drop charts before company list. Numbers + company names are the minimum viable story.
