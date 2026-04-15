# Spec 01 — Project Setup

## Business Context
We need a clean monorepo so the web and crawler services can deploy independently as two Railway services but share types and tracker data.

## Technical Context
- pnpm workspaces monorepo
- Two apps: `apps/web` (Next.js 15) and `apps/crawler` (Express + Playwright)
- One shared package: `packages/shared` (types, tracker lookup)

## Implementation Steps

1. **Init monorepo**
   ```
   privacy-diff/
   ├── package.json              (root, "private": true, workspaces)
   ├── pnpm-workspace.yaml
   ├── .gitignore
   ├── .env.example
   ├── README.md                 (placeholder; final version per spec 09)
   ├── apps/
   │   ├── web/                  (Next.js 15, App Router, TS, Tailwind)
   │   └── crawler/              (Node 20, Express, TS, Playwright)
   └── packages/
       └── shared/               (TS package: types, tracker map loader)
   ```

2. **`apps/web` setup**
   - `pnpm create next-app@latest` — TypeScript, Tailwind, App Router, ESLint, no src/, import alias `@/*`
   - Add: `shadcn/ui` (init with default theme), `recharts`, `zod`
   - Add: `@privacy-diff/shared` workspace dep

3. **`apps/crawler` setup**
   - `pnpm init`, install: `express`, `playwright`, `playwright-extra`, `puppeteer-extra-plugin-stealth`, `zod`, `pino`, `dotenv`
   - Dev deps: `typescript`, `tsx`, `@types/node`, `@types/express`
   - `tsconfig.json` (strict, `module: nodenext`)
   - Scripts: `dev` (`tsx watch src/index.ts`), `build`, `start`
   - Run `npx playwright install chromium` after install

4. **`packages/shared` setup**
   - `pnpm init`, name `@privacy-diff/shared`
   - Export TypeScript types and the tracker lookup function (built in spec 02)
   - Build with `tsc`

5. **Env vars** (`.env.example`)
   ```
   # Web
   DATABASE_URL=postgresql://...
   CRAWLER_URL=http://localhost:8080
   CRAWLER_SHARED_SECRET=change-me
   PUBLIC_BASE_URL=http://localhost:3000

   # Crawler
   PORT=8080
   CRAWLER_SHARED_SECRET=change-me
   WEB_CALLBACK_URL=http://localhost:3000/api/report-callback
   MAX_CONCURRENT_JOBS=3
   ```

6. **Root scripts** (`package.json`)
   ```json
   {
     "scripts": {
       "dev": "pnpm -r --parallel dev",
       "build": "pnpm -r build",
       "lint": "pnpm -r lint"
     }
   }
   ```

## Acceptance Criteria
- [ ] `pnpm install` succeeds at root
- [ ] `pnpm dev` starts both web (port 3000) and crawler (port 8080)
- [ ] Crawler responds to `GET /health` with `{ ok: true }`
- [ ] Web shows default Next.js landing page
- [ ] Shared package builds and is importable from both apps
- [ ] `.env.example` is complete; real `.env` is gitignored

## Notes for Cursor
- Use latest stable versions; don't pin unnecessarily.
- If shadcn init asks questions, choose defaults: Slate base color, CSS variables, RSC yes.
- After completing: update `01-BUILD-PLAN.md` checkbox + note.
