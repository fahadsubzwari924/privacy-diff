import type { TrackerEntry } from '@privacy-diff/shared';
import { launchBrowser, runSession } from '../crawler/session-runner.js';
import { buildResult } from '../crawler/result-builder.js';
import { sendCallback } from './callback.service.js';
import { logger } from '../logger.js';
import { ERROR_MESSAGES } from '../constants/index.js';
import { ZERO_SESSION } from './types.js';

let activeJobs = 0;

export function getActiveJobs(): number {
  return activeJobs;
}

export async function executeCrawl(
  url: string,
  reportId: string,
  callbackUrl: string,
  trackerMap: Record<string, TrackerEntry>,
): Promise<void> {
  activeJobs += 1;
  const browser = await launchBrowser();

  try {
    const [unprotectedResult, protectedResult] = await Promise.allSettled([
      runSession(browser, url, { block: false }, trackerMap),
      runSession(browser, url, { block: true }, trackerMap),
    ]);

    const bothFailed = unprotectedResult.status === 'rejected' && protectedResult.status === 'rejected';
    if (bothFailed) {
      const error = unprotectedResult.reason instanceof Error
        ? unprotectedResult.reason.message
        : ERROR_MESSAGES.BOTH_SESSIONS_FAILED;
      logger.error({ reportId, error }, 'Both crawl sessions failed');
      await sendCallback(callbackUrl, { reportId, status: 'error', error });
      return;
    }

    const partial = unprotectedResult.status === 'rejected' || protectedResult.status === 'rejected';
    const unprotected = unprotectedResult.status === 'fulfilled' ? unprotectedResult.value : ZERO_SESSION;
    const protectedSession = protectedResult.status === 'fulfilled' ? protectedResult.value : ZERO_SESSION;

    if (unprotected.botDetected || protectedSession.botDetected) {
      logger.warn({ reportId }, 'Bot challenge detected during crawl');
      await sendCallback(callbackUrl, { reportId, status: 'error', error: ERROR_MESSAGES.BOT_BLOCKED });
      return;
    }

    const data = buildResult(unprotected, protectedSession, url, partial);
    logger.info({ reportId, blockedRequests: data.blockedRequests, partial }, 'Crawl complete');
    await sendCallback(callbackUrl, { reportId, status: 'done', data });
  } catch (err) {
    const error = err instanceof Error ? err.message : ERROR_MESSAGES.UNEXPECTED_ERROR;
    logger.error({ reportId, error }, 'Crawl service error');
    await sendCallback(callbackUrl, { reportId, status: 'error', error });
  } finally {
    await browser.close();
    activeJobs -= 1;
  }
}
