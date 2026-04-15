# Spec 02 — Tracker Radar Data

## Business Context
The whole product hinges on knowing *which domains are trackers* and *who owns them*. DuckDuckGo publishes this as open data — using it directly is the proof-point that we're building on their ecosystem.

## Technical Context
Two viable sources from DuckDuckGo:
- **Option A (preferred):** [Tracker Radar Data](https://github.com/duckduckgo/tracker-radar) — rich, per-domain JSON files with owner, categories, prevalence, fingerprinting flags.
- **Option B (fallback):** [TDS blocklist](https://staticcdn.duckduckgo.com/trackerblocking/v6/current/android-tds.json) — single small JSON used by their browser. Good if Option A is too heavy.

We bundle the data **at build time** and ship it inside the crawler image. No runtime fetch.

## Implementation Steps

1. **Create build script** `apps/crawler/scripts/build-tracker-map.ts`
   - Download or use a checked-in copy of the TDS JSON file (Option B is simpler — start here)
   - URL: `https://staticcdn.duckduckgo.com/trackerblocking/v6/current/android-tds.json`
   - Parse it into a normalized map:
     ```ts
     type TrackerEntry = {
       domain: string;        // e.g. "google-analytics.com"
       owner: string;         // e.g. "Google LLC"
       category: string;      // e.g. "Analytics"
       prevalence?: number;
     };
     // Output: Record<hostname, TrackerEntry>
     ```
   - Write to `apps/crawler/src/data/tracker-map.json`

2. **Add npm script** in `apps/crawler/package.json`:
   ```json
   "build:trackers": "tsx scripts/build-tracker-map.ts"
   ```

3. **Add lookup function** in `packages/shared/src/tracker-lookup.ts`:
   ```ts
   export function lookupTracker(
     hostname: string,
     map: Record<string, TrackerEntry>
   ): TrackerEntry | null {
     // Try exact match, then walk parent domains
     // foo.bar.google-analytics.com → bar.google-analytics.com → google-analytics.com
     const parts = hostname.toLowerCase().split('.');
     for (let i = 0; i < parts.length - 1; i++) {
       const candidate = parts.slice(i).join('.');
       if (map[candidate]) return map[candidate];
     }
     return null;
   }
   ```

4. **Load map once** at crawler boot, keep in memory.

5. **Document in code comments** that tracker data is from DuckDuckGo's public TDS list, with a link.

## Acceptance Criteria
- [ ] `pnpm --filter crawler build:trackers` produces `tracker-map.json` (>5MB, >10K entries)
- [ ] Manual test: `lookupTracker('www.google-analytics.com', map)` returns Google entry
- [ ] Manual test: `lookupTracker('not-a-tracker-xyz.com', map)` returns null
- [ ] Lookup handles subdomains via suffix matching
- [ ] Code comment explicitly credits DuckDuckGo as source

## Notes for Cursor
- TDS JSON structure: it's a tree under `trackers` keyed by domain, with `owner.name` and `categories` array.
- Pick the first category if multiple; that's fine for v1.
- After completing: update `01-BUILD-PLAN.md`.
