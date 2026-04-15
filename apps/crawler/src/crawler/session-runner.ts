import type { Browser } from 'playwright';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { TrackerEntry, BlockedRequest } from '@privacy-diff/shared';
import type { SessionResult } from './types.js';
import { createInterceptHandler } from './request-interceptor.js';
import { CrawlTimeoutError, CrawlNavigationError } from '../errors/index.js';
import {
  CRAWL_TIMEOUT_MS,
  BOT_CHALLENGE_PATTERNS,
  BROWSER_USER_AGENT,
  BROWSER_VIEWPORT,
  ROUTE_INTERCEPT_PATTERN,
  PAGE_WAIT_UNTIL,
  TIMEOUT_ERROR_KEYWORDS,
} from '../constants/index.js';

chromium.use(stealthPlugin());

export async function runSession(
  browser: Browser,
  url: string,
  options: { block: boolean },
  trackerMap: Record<string, TrackerEntry>,
): Promise<SessionResult> {
  const context = await browser.newContext({
    userAgent: BROWSER_USER_AGENT,
    viewport: BROWSER_VIEWPORT,
  });

  const page = await context.newPage();
  const blockedList: BlockedRequest[] = [];
  let requestCount = 0;
  let totalBytes = 0;

  await page.route(
    ROUTE_INTERCEPT_PATTERN,
    createInterceptHandler({
      block: options.block,
      trackerMap,
      onBlocked: (req) => blockedList.push(req),
    }),
  );

  page.on('request', () => { requestCount += 1; });
  page.on('response', (response) => {
    const length = parseInt(response.headers()['content-length'] ?? '0', 10);
    totalBytes += isNaN(length) ? 0 : length;
  });

  const startTime = Date.now();

  try {
    await page.goto(url, { waitUntil: PAGE_WAIT_UNTIL, timeout: CRAWL_TIMEOUT_MS });
  } catch (err) {
    await context.close();
    const message = err instanceof Error ? err.message : String(err);
    if (TIMEOUT_ERROR_KEYWORDS.some((kw) => message.includes(kw))) {
      throw new CrawlTimeoutError();
    }
    throw new CrawlNavigationError(message);
  }

  const loadTimeMs = Date.now() - startTime;
  const finalUrl = page.url();
  const pageTitle = await page.title();

  const titleLower = pageTitle.toLowerCase();
  const botDetected = BOT_CHALLENGE_PATTERNS.some((pattern) => titleLower.includes(pattern));

  await context.close();

  return {
    finalUrl,
    pageTitle,
    botDetected,
    metrics: { requestCount, totalBytes, loadTimeMs },
    blockedList,
  };
}

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}
