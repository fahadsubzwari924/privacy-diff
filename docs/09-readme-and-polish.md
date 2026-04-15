# Spec 09 — README & Final Polish

## Business Context
Your README is the cover letter. The hiring manager opens GitHub, scans 30 seconds, decides whether to keep reading. Make those 30 seconds count.

## Implementation Steps

### 1. Top of README structure (in this order)

```markdown
# Privacy Diff

> See exactly who's watching you on any website. Built on DuckDuckGo's open Tracker Radar dataset.

**Live demo:** https://privacydiff.app
**Demo video:** https://loom.com/<your-video>

![Demo GIF](./docs/demo.gif)

## Why I built this

I spent a weekend using the DuckDuckGo browser. The protection works great — but it's
*invisible by design*. Users can't see what they're being shielded from, which makes it
hard to convince others why DDG matters. Meanwhile, DDG publishes one of the best open
tracker datasets in the world (Tracker Radar) — and it sits unused as a public-facing tool.

Privacy Diff is a public web app that uses that dataset to produce a shareable report
for any URL. Paste a link, see what 12 companies were watching, share the result.

## How it works

1. You paste a URL.
2. Two headless Chromium sessions load the page in parallel — one with no protection,
   one with DuckDuckGo's tracker blocklist applied.
3. We diff the network activity, group by tracker owner via Tracker Radar, and produce
   a shareable report.

## Built on DuckDuckGo's open data

- Tracker blocklist: [`duckduckgo/tracker-blocklists`](https://github.com/duckduckgo/tracker-blocklists)
  via the public TDS JSON
- Tracker ownership & categorization: [`duckduckgo/tracker-radar`](https://github.com/duckduckgo/tracker-radar)
- Same blocking logic the DuckDuckGo browser ships with — just made visible.

## Architecture

[Insert diagram from 02-ARCHITECTURE.md]

- **Web** — Next.js 15, Railway
- **Crawler** — Express + Playwright, Railway (private service)
- **DB** — Railway Postgres
- Reports cached weekly by URL hash

## What I'd build next at DuckDuckGo

- **Browser extension** that surfaces these stats in real-time as you browse
- **Publisher dashboard** — let site owners audit and track their tracker count over time
- **Trend reports** — "tracker counts on top 1000 news sites, week over week"
- **Embed badges** — sites can display their Privacy Diff score publicly
- **Comparison view** — show users the same URL across regions to expose geo-targeted tracking

## Run locally

[clone, env, pnpm install, pnpm dev]

## Built in ~6 hours

This is a POC built over a weekend with Cursor and Claude. Code is pragmatic, not perfect —
happy to walk through trade-offs in an interview.
```

### 2. Create the demo GIF
- Use [LICEcap](https://www.cockos.com/licecap/) or Kap (Mac)
- ~10 seconds: paste URL → loading → report appears
- Save as `docs/demo.gif`, keep under 5 MB

### 3. Record the Loom
- 60–90 seconds, talking head + screen
- Script:
  1. (10s) "Hi, I'm <name>, I built this for my DuckDuckGo application."
  2. (15s) Show the problem — "DDG protection is invisible. Hard to demo."
  3. (20s) Live demo — paste cnn.com, show report.
  4. (15s) Show GitHub — point at how it uses tracker-radar.
  5. (10s) "Three things I'd build next at DDG: ... Thanks for watching."

### 4. Polish pass on the live site
- [ ] Favicon (use a simple emoji as data URL if no time)
- [ ] OG image renders for shared report URLs
- [ ] Footer credits DDG with link
- [ ] No console errors on production
- [ ] No 404s on assets

### 5. Application package
Have ready to send:
- Live demo URL
- GitHub repo URL (public)
- Loom video URL
- One-paragraph pitch (use the one from `02-ARCHITECTURE.md` notes)

## Acceptance Criteria
- [ ] README renders correctly on GitHub (preview mode)
- [ ] All links in README work
- [ ] Demo GIF embedded and under 5 MB
- [ ] Loom video uploaded, set to public
- [ ] Live URL works on a fresh device
- [ ] Code is reasonably clean — no commented-out blocks, no `console.log` spam
- [ ] `.env.example` is complete and accurate
- [ ] LICENSE file added (MIT is fine)

## Pitch email/message template

> Subject: Senior Backend Engineer application — built a tool for you
>
> Hi DuckDuckGo team,
>
> I'm a backend engineer with 9 years of full-stack experience, applying for the
> Senior Backend Developer role.
>
> Before submitting a normal application, I spent a weekend with the DuckDuckGo
> browser and built [Privacy Diff](https://privacydiff.app) — a public tool that
> uses your open Tracker Radar dataset to make tracker blocking visible and
> shareable.
>
> - Live demo: https://privacydiff.app (try cnn.com)
> - Source: https://github.com/<you>/privacy-diff
> - 90-second walkthrough: https://loom.com/<id>
>
> Would love to talk about the v2 ideas in the README — especially the publisher
> dashboard.
>
> Best,
> <name>

## Notes for Cursor
- This is the last spec. After completing, all checkboxes in `01-BUILD-PLAN.md` should be marked.
- If anything was cut, log it in the "Known Issues / Cuts" section there.
