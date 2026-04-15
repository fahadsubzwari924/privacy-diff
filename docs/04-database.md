# Spec 04 — Database

## Business Context
Reports must persist so users can share URLs and bookmark them. Caching is critical so we don't re-crawl the same site every time it goes viral.

## Technical Context
Single Postgres table on Railway's managed Postgres plugin (same project as web + crawler services). Use `drizzle-orm` for type-safe queries (lightweight, plays nicely with Next.js).

## Implementation Steps

### 1. Install Drizzle in `apps/web`
```
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit
```

### 2. Schema in `apps/web/src/db/schema.ts`

```ts
import { pgTable, text, integer, bigint, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),                    // slug, e.g. "cnn-com-a1b2c3"
    url: text('url').notNull(),
    urlHash: text('url_hash').notNull(),            // sha256 hex of normalized URL
    weekBucket: text('week_bucket').notNull(),      // ISO week, e.g. "2026-W16"
    status: text('status').notNull().$type<'queued' | 'running' | 'done' | 'error'>(),
    error: text('error'),

    finalUrl: text('final_url'),
    pageTitle: text('page_title'),

    unprotectedRequests: integer('unprotected_requests'),
    unprotectedBytes: bigint('unprotected_bytes', { mode: 'number' }),
    unprotectedLoadMs: integer('unprotected_load_ms'),
    protectedRequests: integer('protected_requests'),
    protectedBytes: bigint('protected_bytes', { mode: 'number' }),
    protectedLoadMs: integer('protected_load_ms'),

    blockedRequests: jsonb('blocked_requests'),     // BlockedRequest[]
    companies: jsonb('companies'),                  // CompanySummary[]

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    cacheLookup: index('reports_cache_idx').on(t.urlHash, t.weekBucket),
  })
);
```

### 3. Drizzle config (`drizzle.config.ts`)
- Schema path, out dir for migrations, Postgres URL from env

### 4. Generate + push initial migration
```
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

### 5. DB client in `apps/web/src/db/index.ts`
```ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
const client = postgres(process.env.DATABASE_URL!, { max: 5 });
export const db = drizzle(client);
```

### 6. URL normalization helper (`apps/web/src/lib/url.ts`)
```ts
export function normalizeUrl(input: string): string {
  const u = new URL(input);
  u.hash = '';
  // Strip common tracking params
  ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(p => u.searchParams.delete(p));
  // Drop trailing slash on root only
  return u.toString();
}

export function urlHash(normalized: string): string {
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function currentWeekBucket(): string {
  // ISO week, e.g. "2026-W16"
}

export function makeSlug(url: string): string {
  const host = new URL(url).hostname.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const random = crypto.randomBytes(3).toString('hex');
  return `${host}-${random}`;
}
```

## Acceptance Criteria
- [ ] Migration runs successfully against Railway Postgres
- [ ] Can insert a `reports` row with `status='queued'` from a script
- [ ] Cache index exists (verify in Railway DB data tab)
- [ ] Lookup by `(urlHash, weekBucket)` returns cached row in <50ms
- [ ] URL normalization strips utm params and hash
- [ ] Two different inputs that normalize to same URL produce same hash

## Notes for Cursor
- Don't bother with a separate users table or audit log. Single table is the spec.
- After completing: update `01-BUILD-PLAN.md`.
