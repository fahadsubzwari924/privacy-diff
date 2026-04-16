# Spec 06 — Homepage & Analyze Flow

## Business Context
The homepage is a one-shot conversion. User shows up, sees one input, gets a report. No nav, no marketing fluff above the fold. The product *is* the demo.

## Technical Context
Single page (`apps/web/src/app/page.tsx`), client component for the input handling, server component for the rest.

## Layout

```
┌──────────────────────────────────────────────────┐
│                                                  │
│        Privacy Diff                              │
│        See who's watching you on any site.       │
│                                                  │
│   ┌────────────────────────────────────┐ ┌────┐  │
│   │ https://example.com                │ │ Go │  │
│   └────────────────────────────────────┘ └────┘  │
│                                                  │
│   Try: cnn.com · nytimes.com · amazon.com        │
│                                                  │
│   ─────────────────────────────────────          │
│                                                  │
│   How it works (3 short cards, side-by-side)     │
│   1. We load the page twice                      │
│   2. Once unprotected, once with DDG's blocklist │
│   3. We show you exactly who was watching        │
│                                                  │
│   ─────────────────────────────────────          │
│   Built on DuckDuckGo's open Tracker Radar.      │
│   [link to GitHub]                               │
└──────────────────────────────────────────────────┘
```

## Implementation Steps

1. **Hero section** with title, tagline, input, and a primary CTA button.
2. **Example chips** — clicking auto-fills + submits.
3. **"How it works"** — three short cards (use shadcn `Card`).
4. **Footer** — credit DDG with link to `tracker-radar` repo.

## Analyze Flow (client behavior)

```ts
async function onSubmit(url: string) {
  // 1. POST /api/analyze
  const res = await fetch('/api/analyze', { method: 'POST', body: JSON.stringify({ url }) });
  const { reportId } = await res.json();

  // 2. Navigate to /r/:reportId immediately
  router.push(`/r/${reportId}`);
}
```

The report page itself handles the loading-vs-done state (spec 07).

## States to handle

| State | UI |
|---|---|
| Idle | Input enabled, button "Analyze" |
| Submitting | Button spinner, input disabled |
| Validation error | Inline red text under input |
| Rate limited | Toast/banner: "Slow down — try again in an hour." |
| Server error | Toast: "Something went wrong. Try again." |

## Acceptance Criteria
- [ ] Page loads in <1s on a fresh browser
- [ ] Input auto-prepends `https://` if user types `example.com`
- [ ] Hitting Enter in the input submits the form
- [ ] Example chips work and trigger analysis
- [ ] Loading state visually obvious during submit
- [ ] Errors surface as user-readable messages
- [ ] Mobile-responsive (test at 375px width)
- [ ] Lighthouse perf score >90 (it's basically static)

## Visual Tone
- Clean, lots of whitespace
- One accent color (consider a desaturated orange/red — DDG-inspired but not a clone)
- Sans-serif (Inter is fine)
- Don't over-design. The report page is where polish matters more.

## Notes for Cursor
- Use shadcn `Input`, `Button`, `Card`, `Toast`
- Use Next.js `useRouter` from `next/navigation`
- After completing: update `01-BUILD-PLAN.md`.
