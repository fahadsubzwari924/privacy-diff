import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { TrackerEntry } from "@privacy-diff/shared";

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));
const TRACKER_MAP_PATH = path.join(DIR_NAME, "data", "tracker-map.json");

/**
 * Load the tracker map from the generated JSON file.
 * Called once at crawler startup — the returned map is held in memory for fast lookups.
 *
 * @returns Record<string, TrackerEntry> keyed by domain
 * @throws Error if the tracker-map.json file cannot be read or is malformed
 */
export function loadTrackerMap(): Record<string, TrackerEntry> {
  try {
    const rawData = fs.readFileSync(TRACKER_MAP_PATH, "utf-8");
    const map = JSON.parse(rawData) as Record<string, TrackerEntry>;
    console.warn(
      `✓ Loaded tracker map: ${Object.keys(map).length} entries from ${TRACKER_MAP_PATH}`
    );
    return map;
  } catch (error) {
    throw new Error(
      `Failed to load tracker map from ${TRACKER_MAP_PATH}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
