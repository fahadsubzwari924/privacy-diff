import { and, count, eq, gte } from "drizzle-orm";

import { db } from "./index";
import { rateLimits } from "./schema";

export async function countRecentRateEvents(
  ipHash: string,
  since: Date,
): Promise<number> {
  const rows = await db
    .select({ c: count() })
    .from(rateLimits)
    .where(
      and(eq(rateLimits.ipHash, ipHash), gte(rateLimits.createdAt, since)),
    );
  return Number(rows[0]?.c ?? 0);
}

export async function insertRateLimitEvent(ipHash: string): Promise<void> {
  await db.insert(rateLimits).values({ ipHash });
}
