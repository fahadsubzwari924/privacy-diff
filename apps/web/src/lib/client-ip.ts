import { createHash } from "crypto";

function hashIp(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Returns a hashed identity for rate limiting derived from the first hop of
 * `x-forwarded-for` (Railway / reverse proxy standard).
 *
 * Returns `null` when the header is absent — callers should decide whether to
 * allow or reject such requests rather than grouping all unidentified callers
 * under a single shared key.
 */
export function rateLimitIdentityFromHeaders(headers: Headers): string | null {
  const first = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!first) return null;
  return hashIp(first);
}
