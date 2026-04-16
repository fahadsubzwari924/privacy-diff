import { env } from "../../env";
import {
  API_ERROR_CODES,
  ERROR_MESSAGES,
  RATE_LIMIT_WINDOW_MS,
} from "../constants/index";
import * as rateLimitRepo from "../db/rate-limit-repository";
import * as reportRepo from "../db/report-repository";
import { rateLimitIdentityFromHeaders } from "../lib/client-ip";
import { notifyCrawlerAccepted } from "../lib/crawler";
import { logger } from "../lib/logger";
import { analyzeBodySchema } from "../lib/schemas/analyze-body.schema";
import { makeSlug } from "../lib/slug-generator";
import { normalizeUrl, urlHash } from "../lib/url-normalizer";
import { currentWeekBucket } from "../lib/week-bucket";
import type { JsonServiceResult } from "../types/service-http.types";

function badRequest(
  details: unknown,
  message = "Invalid request",
): JsonServiceResult {
  return {
    status: 400,
    body: {
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message,
      details,
    },
  };
}

function rateLimitExceededResponse(): JsonServiceResult {
  return {
    status: 429,
    body: {
      code: API_ERROR_CODES.RATE_LIMITED,
      message:
        "Too many analyses from this network in the last hour. Try again later.",
    },
  };
}

async function persistQueuedReport(
  slug: string,
  normalized: string,
  hash: string,
  week: string,
): Promise<void> {
  await reportRepo.createReport({
    id: slug,
    url: normalized,
    urlHash: hash,
    weekBucket: week,
    status: "queued",
  });
}

async function notifyCrawlerOrMarkFailed(
  slug: string,
  normalized: string,
  hashPrefix: string,
): Promise<JsonServiceResult> {
  const callbackBase = env.internalUrl ?? env.publicBaseUrl;
  const callbackUrl = new URL("/api/report-callback", callbackBase).href;
  const accepted = await notifyCrawlerAccepted(slug, normalized, callbackUrl);
  if (!accepted) {
    await reportRepo.updateReportStatus(
      slug,
      "error",
      ERROR_MESSAGES.CRAWLER_UNREACHABLE,
    );
    return {
      status: 503,
      body: {
        code: API_ERROR_CODES.CRAWLER_UNREACHABLE,
        message: "Analysis service is temporarily unavailable.",
      },
    };
  }

  logger.info({ reportId: slug, urlHashPrefix: hashPrefix }, "analyze_queued");
  return { status: 202, body: { reportId: slug, cached: false } };
}

async function enqueueAnalyzeJob(
  normalized: string,
  hash: string,
  week: string,
  headers: Headers,
): Promise<JsonServiceResult> {
  const ipKey = rateLimitIdentityFromHeaders(headers);
  if (ipKey !== null) {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recent = await rateLimitRepo.countRecentRateEvents(ipKey, windowStart);
    if (recent >= env.rateLimitMaxPerHour) {
      return rateLimitExceededResponse();
    }
    await rateLimitRepo.insertRateLimitEvent(ipKey);
  }

  const slug = makeSlug(normalized);
  await persistQueuedReport(slug, normalized, hash, week);

  return notifyCrawlerOrMarkFailed(slug, normalized, hash.slice(0, 8));
}

export async function postAnalyze(request: Request): Promise<JsonServiceResult> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return badRequest({ body: ["Invalid JSON"] });
  }

  const parsed = analyzeBodySchema.safeParse(json);
  if (!parsed.success) {
    return badRequest(parsed.error.flatten().fieldErrors);
  }

  let normalized: string;
  try {
    normalized = normalizeUrl(parsed.data.url);
  } catch {
    return badRequest({ url: ["Could not normalize URL"] }, "Invalid URL");
  }

  const hash = urlHash(normalized);
  const week = currentWeekBucket();
  const cached = await reportRepo.findCachedReport(hash, week);
  if (cached) {
    logger.info(
      { reportId: cached.id, urlHashPrefix: hash.slice(0, 8) },
      "analyze_cache_hit",
    );
    return { status: 200, body: { reportId: cached.id, cached: true } };
  }

  return enqueueAnalyzeJob(normalized, hash, week, request.headers);
}
