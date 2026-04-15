# Spec 07 — Report Page (the "wow" surface)

## Business Context
This is the page users will share. It must be **screenshot-worthy on a phone**. If a journalist embeds this in an article, it should look credible. If a user tweets it, it should make non-technical friends say "wait, what?"

## Technical Context
Server-rendered page at `/r/[slug]/page.tsx`. Handles three states: queued/running, done, error. Uses minimal client JS — only for polling and the share button.

## Page Structure (when status = done)

```
┌──────────────────────────────────────────────────────┐
│  ← Privacy Diff                  [Share] [Analyze →] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Report for cnn.com                                  │
│  CNN - Breaking News, Latest News and Videos         │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │   37 trackers blocked                          │  │
│  │   from 12 companies                            │  │
│  │                                                │  │
│  │   That's 1.4 MB of data and 2.3s of load time  │  │
│  │   you didn't have to give them.                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ─── Side-by-side ───                                │
│                                                      │
│  ┌──────────────┐    ┌──────────────┐                │
│  │ Unprotected  │    │ Protected    │                │
│  │ 142 requests │    │  98 requests │                │
│  │ 3.2 MB       │    │ 1.8 MB       │                │
│  │ 4.7s load    │    │ 2.4s load    │                │
│  └──────────────┘    └──────────────┘                │
│                                                      │
│  ─── Who was watching? ───                           │
│                                                      │
│  [Bar chart: companies by request count]             │
│                                                      │
│  Top trackers:                                       │
│  • Google LLC          — 18 requests, Analytics, Ads │
│  • Meta Platforms      —  9 requests, Social, Ads    │
│  • Adobe               —  4 requests, Analytics      │
│  • ... [show top 10, "Show all" expands]             │
│                                                      │
│  ─── Categories ───                                  │
│  [Pie or simple bar by category]                     │
│  Advertising 22 · Analytics 11 · Social 4            │
│                                                      │
│  ─── CTA ───                                         │
│  ┌────────────────────────────────────────────────┐  │
│  │  Get this protection automatically.            │  │
│  │  [Download DuckDuckGo Browser →]               │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  Footer: Method · About · Built on Tracker Radar     │
└──────────────────────────────────────────────────────┘
```

## Loading state (status = queued/running)

Big animated indicator + status messages that change:
- "Loading the page unprotected..."
- "Loading with DuckDuckGo's tracker blocking..."
- "Comparing what was blocked..."

Poll `/api/report/:id/status` every 2s. On `done`, refresh the page (or hydrate without refresh — your call). On `error`, show a friendly error card.

## Implementation Steps

1. **Page server component** — fetch the report from DB by slug.
2. **If status !== done** → render `<LoadingView reportId={...} />` (client component that polls)
3. **If status === done** → render full report
4. **`metadata`** — set OG image, title, description for sharing:
   - Title: "37 trackers blocked on cnn.com — Privacy Diff"
   - Description: "12 companies were watching. See the full breakdown."
   - OG image: dynamic (Next.js `opengraph-image.tsx`) — bonus if time

## Components to build

- `<HeroStat>` — the giant headline number
- `<MetricsCompare>` — two cards side-by-side
- `<CompanyList>` — sortable list with category tags
- `<CategoryChart>` — recharts horizontal bar
- `<DownloadCTA>` — link to `https://duckduckgo.com/app`
- `<ShareButton>` — copies report URL to clipboard with toast
- `<LoadingView>` — polls status

## Empty / edge case copy

| Case | Message |
|---|---|
| 0 trackers blocked | "No trackers detected — this site respects your privacy." 🎉 |
| Site failed to load | "We couldn't load this page. Some sites block automated browsers." |
| Same numbers both sides | "No blocking effect — the site loaded the same either way." |

## Acceptance Criteria
- [ ] Loading state polls status and updates without page refresh
- [ ] Done state renders all sections with real data
- [ ] Hero stat headline is correct math
- [ ] Bar chart renders without overflow on mobile
- [ ] Company list shows top 10 with "show all" toggle
- [ ] Share button copies URL and shows confirmation
- [ ] Download CTA links to `https://duckduckgo.com/app`
- [ ] OG meta tags present (verify with Twitter card validator)
- [ ] Mobile screenshot looks good (test at 375px)
- [ ] Error state is graceful, not a stack trace

## Notes for Cursor
- Use Recharts `BarChart` with horizontal orientation for company list
- Use `Intl.NumberFormat` for byte/ms formatting (e.g., "1.4 MB", "2.3s")
- Keep client JS minimal — only `LoadingView` and `ShareButton` need 'use client'
- After completing: update `01-BUILD-PLAN.md`.
