import { env } from "../../env";
import { logger } from "./logger";

/**
 * Notifies the crawler to start a job. Awaits the HTTP handshake only.
 * @returns true when the crawler accepted the job (HTTP 2xx).
 */
export async function notifyCrawlerAccepted(
  reportId: string,
  url: string,
  callbackUrl: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${env.crawlerUrl}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.crawlerSharedSecret}`,
      },
      body: JSON.stringify({ reportId, url, callbackUrl }),
      cache: "no-store",
    });
    if (!res.ok) {
      logger.warn(
        { reportId, httpStatus: res.status },
        "Crawler rejected crawl request",
      );
    }
    return res.ok;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ reportId, err: message }, "Crawler request failed");
    return false;
  }
}
