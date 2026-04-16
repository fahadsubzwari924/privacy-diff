import { z } from "zod";

const trackerEntrySchema = z
  .object({
    domain: z.string(),
    owner: z.string(),
    category: z.string(),
    prevalence: z.number().optional(),
  })
  .strict();

const blockedRequestSchema = z
  .object({
    url: z.string(),
    hostname: z.string(),
    tracker: trackerEntrySchema,
    bytesSaved: z.number().optional(),
  })
  .strict();

const sessionMetricsSchema = z
  .object({
    requestCount: z.number(),
    totalBytes: z.number(),
    loadTimeMs: z.number(),
  })
  .strict();

const trackerOwnerSummarySchema = z
  .object({
    owner: z.string(),
    primaryCategory: z.string(),
    requestCount: z.number(),
    domains: z.array(z.string()),
    allCategories: z.array(z.string()),
  })
  .strict();

const analysisResultSchema = z.object({
  url: z.string(),
  finalUrl: z.string(),
  pageTitle: z.string(),
  partial: z.boolean(),
  unprotected: sessionMetricsSchema,
  protected: sessionMetricsSchema,
  totalRequests: z.number(),
  blockedRequests: z.number(),
  bytesSaved: z.number(),
  loadTimeSavedMs: z.number(),
  blocked: z.array(blockedRequestSchema),
  byOwner: z.array(trackerOwnerSummarySchema),
  categories: z.record(z.string(), z.number()),
  crawledAt: z.string(),
});

export const crawlCallbackBodySchema = z.discriminatedUnion("status", [
  z
    .object({
      reportId: z.string().min(1),
      status: z.literal("done"),
      data: analysisResultSchema,
    })
    .strict(),
  z
    .object({
      reportId: z.string().min(1),
      status: z.literal("error"),
      error: z.string(),
    })
    .strict(),
]);

export type CrawlCallbackBody = z.infer<typeof crawlCallbackBodySchema>;
