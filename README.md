<div align="center">

# Privacy Diff

**See exactly who's watching you on any website.**

Built on DuckDuckGo's open [Tracker Radar](https://github.com/duckduckgo/tracker-radar) dataset.

[**Live Demo →**](https://privacydiff.app) · [**Video Walkthrough →**](https://loom.com/your-video-id) · [**About**](#why-i-built-this)

![Demo](./docs/demo.gif)

</div>

---

## What it does

Paste any URL. We load the page twice in parallel — once unprotected, once with DuckDuckGo's tracker blocklist applied — then show you a shareable report:

- How many trackers were blocked
- Which companies were watching (Google, Meta, Adobe, Criteo…)
- How much data and load time you didn't have to give them
- A side-by-side breakdown by category (Advertising, Analytics, Social, Fingerprinting)

Think *Lighthouse, but for surveillance.*

## Why I built this

I'm applying for the Senior Backend Developer role at DuckDuckGo. Rather than send a normal application, I spent a weekend with the DDG browser and noticed something:

> **DuckDuckGo's protection is invisible by design.** Great UX, but it makes it hard for users to *see* what they're being shielded from — and hard to convince friends and family why DDG matters.

Meanwhile, DuckDuckGo publishes one of the best open tracker datasets in the world (Tracker Radar) — and there's no public-facing tool that uses it to make tracking visible.

So I built one. Same blocking logic the DDG browser ships with, just made into a shareable, explainable artifact.

## How it works

```
You paste a URL
      │
      ▼
Two headless Chromium sessions run in parallel:
   ├─ Session A: no blocking (baseline)
   └─ Session B: blocks any host in DuckDuckGo's tracker list
      │
      ▼
Diff the network activity. For each blocked request, look up the
owning company and category from Tracker Radar.
      │
      ▼
Generate a shareable report at /r/{slug}
```

Reports are cached weekly per URL — viral hits don't re-crawl every time.

## Built on DuckDuckGo's open data

| Source | Used for |
|---|---|
| [`duckduckgo/tracker-blocklists`](https://github.com/duckduckgo/tracker-blocklists) (TDS JSON) | The blocklist itself — same one DDG's browser uses |
| [`duckduckgo/tracker-radar`](https://github.com/duckduckgo/tracker-radar) | Tracker ownership, categorization, prevalence data |

The tracker map is bundled at build time and looked up in-memory (O(1) suffix match on hostnames) so analysis is fast.

## Tech stack

- **Next.js 15** (App Router, TypeScript, Tailwind, shadcn/ui) — web app
- **Express + Playwright** — crawler service (runs the dual-Chromium diff)
- **Drizzle ORM + Postgres** — persistence and weekly report cache
- **Recharts** — visualizations
- **Zod** — input validation everywhere
- **pnpm workspaces** — monorepo
- **Railway** — deploys the whole stack (web + crawler + Postgres) on private network

## Architecture

```
                    ┌──────────── Railway Project ────────────┐
                    │                                          │
   Browser ──HTTPS──┼──▶  web (Next.js, public)                │
                    │      │                                   │
                    │      │  internal network                 │
                    │      ▼                                   │
                    │     crawler (Express + Playwright)       │
                    │      │                                   │
                    │      ▼                                   │
                    │     Postgres (cached reports)            │
                    └──────────────────────────────────────────┘
```

**Why two services?** Playwright is RAM-heavy and long-running; the Next.js app is light and request-driven. Separating them lets each scale and fail independently while sharing one project, one bill, and private DNS.

**Why Railway-only (no Vercel)?** One deploy target, no cold starts, simpler ops for a POC. Crawler↔web calls happen over `crawler.railway.internal` — no public callback URL, no CORS dance.

For a deeper walkthrough see [`docs/02-ARCHITECTURE.md`](./docs/02-ARCHITECTURE.md).

## Run locally

**Prerequisites:** Node 20+, pnpm 9+, Docker (for Playwright dependencies on Linux), a Postgres URL.

```bash
# 1. Clone and install
git clone https://github.com/your-username/privacy-diff
cd privacy-diff
pnpm install

# 2. Install Playwright browsers
pnpm --filter crawler exec playwright install chromium

# 3. Set up env
cp .env.example .env
# Fill in DATABASE_URL and CRAWLER_SHARED_SECRET

# 4. Build the tracker lookup map
pnpm --filter crawler build:trackers

# 5. Apply database schema
pnpm --filter web drizzle-kit push

# 6. Run everything
pnpm dev
```

Open [localhost:3000](http://localhost:3000), paste a URL, watch it work.

## Project structure

```
privacy-diff/
├── README.md                  ← you are here
├── CLAUDE.md                  ← AI-agent entry point
├── .cursorrules               ← Cursor project rules
├── docs/
│   ├── 00-PRODUCT-OVERVIEW.md
│   ├── 01-BUILD-PLAN.md
│   ├── 02-ARCHITECTURE.md
│   └── specs/                 ← spec-by-spec implementation plan
├── apps/
│   ├── web/                   ← Next.js app
│   └── crawler/               ← Express + Playwright service
└── packages/
    └── shared/                ← shared types and tracker lookup
```

## What I'd build next at DuckDuckGo

Three concrete next steps if I were extending this on the team:

1. **Browser extension** — surface the same diff in real-time as you browse, not just on demand. The hard part isn't tracker blocking (DDG already does it) — it's the explainable, shareable report. This makes the protection a *talking point*, not a silent feature.

2. **Publisher dashboard** — let site owners audit their tracker count over time, get a public Privacy Diff badge, and see which third-party scripts are dragging their site into surveillance. Aligns with DDG's advocacy stance and creates accountability pressure on bad actors.

3. **Trend reports** — weekly automated crawls of the top 1,000 sites, ranked. *"Tracker count on top news sites, week over week."* Generates ongoing PR moments and useful research data — journalists love rankings.

## Trade-offs and things I'd change

Honest accounting since this was built in a weekend:

- **No queue (BullMQ/Redis) for the crawler** — uses an in-process concurrency cap. Fine for v1; would replace under real load.
- **Tracker data bundled at build time** — needs a redeploy to refresh. A weekly Railway cron would fix this in 20 minutes.
- **Best-effort byte counting** — uses `Content-Length` headers when available; some chunked responses are estimated. CDP's `Network.getResponseBody` would be more accurate but slower.
- **Some sites block headless browsers** — using `playwright-extra` + stealth helps, but ~5–10% of sites still detect and refuse. Reports surface this gracefully.
- **No screenshots in v1** — cut to save build time. Adds compelling visual diff if added back.

## Privacy

This tool itself respects what it preaches:

- No accounts, no logins, no tracking
- IPs are used only for rate limiting (10 analyses per hour) and never persisted
- URLs are stored to enable shareable reports — query strings are stripped from logs
- No third-party analytics, no marketing cookies
- Full source code below

## Built in ~6 hours

This is a POC built over a weekend with Cursor and Claude Code, working from a structured spec plan in `docs/specs/`. Code is pragmatic, not perfect — happy to walk through any trade-off in an interview.

## License

MIT. Tracker data is © DuckDuckGo, used under their respective licenses (Apache 2.0 / CC BY-NC-SA 4.0 — see source repos).

---

<div align="center">

**Not affiliated with DuckDuckGo.** Built independently as a job application proof-of-work.

</div>
