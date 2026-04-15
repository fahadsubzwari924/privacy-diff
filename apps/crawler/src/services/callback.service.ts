import type { CrawlCallback } from "@privacy-diff/shared";
import { RETRY_DELAYS_MS } from "../constants/index.js";
import { env } from "../env.js";
import { logger } from "../logger.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendCallback(callbackUrl: string, payload: CrawlCallback): Promise<void> {
  const hostname = (() => {
    try {
      return new URL(callbackUrl).hostname;
    } catch {
      return "unknown";
    }
  })();

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.crawlerSharedSecret}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.info({ reportId: payload.reportId, status: payload.status }, "Callback delivered");
        return;
      }

      logger.warn(
        { reportId: payload.reportId, attempt: attempt + 1, httpStatus: response.status, callbackHost: hostname },
        "Callback failed, retrying",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(
        { reportId: payload.reportId, attempt: attempt + 1, error: message, callbackHost: hostname },
        "Callback error, retrying",
      );
    }

    if (attempt < RETRY_DELAYS_MS.length - 1) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  logger.error({ reportId: payload.reportId, callbackHost: hostname }, "Callback failed after all retries");
}
