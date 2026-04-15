# Spec 08 — Deployment (Railway-only)

## Business Context
A live URL is non-negotiable for the job application. Deploy early, redeploy often. We deploy everything to Railway for simplicity: one dashboard, one bill, internal networking between services, no cold starts.

## Technical Context
One Railway project with three components:
- **web** service — Next.js (Dockerfile, public)
- **crawler** service — Express + Playwright (Dockerfile, private)
- **Postgres** plugin — managed Postgres add-on

The web service calls the crawler over Railway's private network (`crawler.railway.internal:8080`) — no public crawler URL needed, no shared HTTPS callback over the public internet.

## Implementation Steps

### 1. Add a Dockerfile for the web app

`apps/web/Dockerfile`:
```dockerfile
FROM node:20-bookworm-slim AS base
RUN npm install -g pnpm
WORKDIR /app

# Install deps (cache layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Build
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter shared build
RUN pnpm --filter web build

EXPOSE 3000
CMD ["pnpm", "--filter", "web", "start"]
```

In `apps/web/package.json`, ensure `start` script is `next start -p 3000`.

### 2. Crawler Dockerfile (unchanged from original spec)

`apps/crawler/Dockerfile`:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/crawler/package.json ./apps/crawler/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

COPY packages/shared ./packages/shared
COPY apps/crawler ./apps/crawler

RUN pnpm --filter shared build
RUN pnpm --filter crawler build:trackers
RUN pnpm --filter crawler build

EXPOSE 8080
CMD ["pnpm", "--filter", "crawler", "start"]
```

### 3. Railway project setup — 20 min

1. **Create project** at railway.app → "New Project" → "Empty Project". Name it `privacy-diff`.

2. **Add Postgres plugin**
   - Click "+ New" → "Database" → "Add PostgreSQL"
   - Railway will inject `DATABASE_URL` automatically into linked services.

3. **Add crawler service**
   - "+ New" → "GitHub Repo" → select your repo
   - Settings → Source → set **Root Directory** to `/` (monorepo root)
   - Settings → Build → set **Dockerfile Path** to `apps/crawler/Dockerfile`
   - Settings → Networking → leave port as `8080`. **Do NOT generate a public domain** — keep it private.
   - Settings → Variables:
     ```
     PORT=8080
     CRAWLER_SHARED_SECRET=<openssl rand -hex 32>
     WEB_CALLBACK_URL=http://web.railway.internal:3000/api/report-callback
     MAX_CONCURRENT_JOBS=3
     ```
   - Note the service's internal hostname: `crawler.railway.internal`

4. **Add web service**
   - "+ New" → "GitHub Repo" → same repo
   - Settings → Source → Root Directory `/`
   - Settings → Build → Dockerfile Path `apps/web/Dockerfile`
   - Settings → Networking → "Generate Domain" (this becomes your public URL)
   - Settings → Variables (link to Postgres plugin so `DATABASE_URL` is auto-injected, then add):
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     CRAWLER_URL=http://crawler.railway.internal:8080
     CRAWLER_SHARED_SECRET=${{crawler.CRAWLER_SHARED_SECRET}}
     PUBLIC_BASE_URL=https://<your-railway-domain>
     NODE_ENV=production
     ```
     The `${{...}}` syntax references variables from other services — set this up in Railway's variable UI.

5. **Run initial DB migration**
   - From local, with `DATABASE_URL` pointing to Railway Postgres (copy from Postgres plugin → Variables → `DATABASE_URL`):
     ```
     pnpm --filter web drizzle-kit push
     ```

### 4. Health endpoints (required for Railway)

Add to crawler:
```ts
// apps/crawler/src/index.ts
app.get('/health', (req, res) => res.json({ ok: true, jobs: currentJobs }));
```

Add to web (`apps/web/src/app/api/health/route.ts`):
```ts
export async function GET() {
  return Response.json({ ok: true });
}
```

In Railway service settings → Healthcheck:
- crawler: `/health`
- web: `/api/health`

### 5. Domain (optional but recommended) — 10 min
1. Buy `privacydiff.app` (or `.dev`, `.io`) on Namecheap.
2. Railway web service → Settings → Networking → "Custom Domain" → add domain.
3. Update DNS at Namecheap with the CNAME Railway provides.
4. Update `PUBLIC_BASE_URL` env var to the custom domain. Redeploy web.

### 6. Smoke test (the final check)
- [ ] Open homepage on phone → loads
- [ ] Analyze cnn.com → report appears in <60s
- [ ] Copy report URL, open in incognito → still works
- [ ] Re-analyze cnn.com → instant (cache hit)
- [ ] Check Railway Postgres data tab → row exists
- [ ] Check crawler logs → crawl completed cleanly
- [ ] Check web logs → no errors
- [ ] Verify crawler has NO public domain (security check — should only be reachable from web service)

## Acceptance Criteria
- [ ] Live URL accessible from any device
- [ ] Full flow works end-to-end on production
- [ ] Crawler is NOT publicly accessible (only via internal network)
- [ ] No env secrets committed to git
- [ ] Logs don't contain raw URLs with query strings
- [ ] HTTPS enforced on web service (Railway auto-provisions)

## Cost Watch
- Railway free trial: $5 credit; Hobby plan is $5/mo with $5 included usage.
- Both services running idle: ~$3–5/mo combined.
- Playwright service is the RAM hog. Set Railway resource limit to 1 GB RAM on crawler if needed.
- If costs creep, set crawler `MAX_CONCURRENT_JOBS=2` and add stricter rate limit in spec 05.

## Why Railway-only (vs Vercel + Railway)

Worth noting in your README architecture section:
- One deploy target = simpler ops, faster iteration for a POC
- No cold starts (Vercel hobby cold-starts API routes)
- Crawler↔web calls happen on private network (faster, no public callback URL needed)
- Easier to migrate later if needed (it's just Docker)

## Notes for Cursor
- After completing: update `01-BUILD-PLAN.md` checkbox + note.
- If Railway internal DNS is flaky during first deploy, fall back to Railway-generated public URLs for both services and use `CRAWLER_SHARED_SECRET` as before. Internal networking is preferred but not required.
