import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import type { BlockedRequest, CompanySummary, ReportStatus } from './report.types';

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    urlHash: text('url_hash').notNull(),
    weekBucket: text('week_bucket').notNull(),
    status: text('status').notNull().$type<ReportStatus>(),
    error: text('error'),

    finalUrl: text('final_url'),
    pageTitle: text('page_title'),

    unprotectedRequests: integer('unprotected_requests'),
    unprotectedBytes: bigint('unprotected_bytes', { mode: 'number' }),
    unprotectedLoadMs: integer('unprotected_load_ms'),
    protectedRequests: integer('protected_requests'),
    protectedBytes: bigint('protected_bytes', { mode: 'number' }),
    protectedLoadMs: integer('protected_load_ms'),

    blockedRequests: jsonb('blocked_requests').$type<BlockedRequest[]>(),
    companies: jsonb('companies').$type<CompanySummary[]>(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('reports_cache_idx').on(t.urlHash, t.weekBucket)],
);

export const rateLimits = pgTable(
  'rate_limits',
  {
    id: serial('id').primaryKey(),
    ipHash: text('ip_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('rate_limits_ip_created_idx').on(t.ipHash, t.createdAt)],
);
