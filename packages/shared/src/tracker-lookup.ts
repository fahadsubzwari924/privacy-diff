import type { TrackerEntry } from "./types";

/**
 * Look up a tracker entry by hostname using suffix-matching.
 *
 * Walks from left to right, dropping subdomains until a match is found:
 * - www.analytics.google.com
 * - analytics.google.com
 * - google.com (if in map, return it; otherwise null)
 *
 * This handles both exact domain matches and subdomain nesting.
 *
 * @param hostname Hostname to look up (e.g. "www.google-analytics.com")
 * @param map Tracker map keyed by domain (e.g. from tracker-map.json)
 * @returns TrackerEntry if found, null otherwise
 */
export function lookupTracker(
  hostname: string,
  map: Record<string, TrackerEntry>
): TrackerEntry | null {
  if (!hostname || !map) return null;

  const parts = hostname.toLowerCase().split(".");

  // Walk from left to right, trying progressively shorter domain suffixes
  for (let i = 0; i < parts.length - 1; i++) {
    const candidate = parts.slice(i).join(".");
    if (map[candidate]) {
      return map[candidate];
    }
  }

  return null;
}
