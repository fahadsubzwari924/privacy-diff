import { z } from 'zod';
import type { RequestHandler } from 'express';
import type { TrackerEntry } from '@privacy-diff/shared';
import { ssrfGuard } from '../security/ssrf-guard.js';
import { executeCrawl, getActiveJobs } from '../services/crawl.service.js';
import { SsrfError } from '../errors/index.js';
import { env } from '../env.js';
import { logger } from '../logger.js';
import {
  ERROR_CODES,
  ERROR_MESSAGES,
  CRAWL_JOB_STATUS,
  APP_LOCALS_KEYS,
} from '../constants/index.js';

const crawlBodySchema = z.object({
  url: z.string().url({ message: 'url must be a valid URL' }),
  reportId: z.string().min(1, { message: 'reportId is required' }),
  callbackUrl: z.string().url({ message: 'callbackUrl must be a valid URL' }),
});

export const handleCrawl: RequestHandler = async (req, res) => {
  const parsed = crawlBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: ERROR_MESSAGES.INVALID_BODY,
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const { url, reportId, callbackUrl } = parsed.data;

  try {
    await ssrfGuard(url);
  } catch (err) {
    if (err instanceof SsrfError) {
      res.status(400).json({ code: ERROR_CODES.SSRF_REJECTED, message: err.message });
      return;
    }
    res.status(500).json({ code: ERROR_CODES.INTERNAL_ERROR, message: ERROR_MESSAGES.SSRF_URL_VALIDATION });
    return;
  }

  if (getActiveJobs() >= env.maxConcurrentJobs) {
    res.status(503).json({ code: ERROR_CODES.CAPACITY_EXCEEDED, message: ERROR_MESSAGES.CAPACITY_EXCEEDED });
    return;
  }

  const trackerMap = req.app.locals[APP_LOCALS_KEYS.TRACKER_MAP] as Record<string, TrackerEntry>;
  logger.info({ reportId }, 'Crawl job accepted');

  void executeCrawl(url, reportId, callbackUrl, trackerMap);

  res.status(202).json({ reportId, status: CRAWL_JOB_STATUS.ACCEPTED });
}
