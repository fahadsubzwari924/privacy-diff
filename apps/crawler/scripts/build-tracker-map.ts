/**
 * Build script to fetch DuckDuckGo's TDS blocklist and generate a normalized
 * tracker map for fast in-memory lookups during crawls.
 *
 * Uses android-tds.json (more accessible than web TDS) from DuckDuckGo's open
 * tracker-blocklists project. Same blocking logic used in DDG's browser.
 *
 * Source: https://github.com/duckduckgo/tracker-blocklists
 * Data: https://staticcdn.duckduckgo.com/trackerblocking/v6/current/android-tds.json
 *
 * Runs at build time: `pnpm --filter crawler build:trackers`
 * Output: apps/crawler/src/data/tracker-map.json
 */

/* eslint-disable import/no-nodejs-modules */
// @ts-ignore - scripts/ is excluded from main tsconfig
import fs from "fs";
// @ts-ignore - scripts/ is excluded from main tsconfig
import path from "path";
// @ts-ignore - scripts/ is excluded from main tsconfig
import { fileURLToPath } from "url";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TrackerEntry = any;

// TDS JSON structure from DDG
interface TDSEntity {
  name: string;
  displayName?: string;
}

interface TDSTrackerEntry {
  owner?: { name?: string; displayName?: string };
  default?: string;
  categories?: string[];
  prevalence?: number;
}

interface TDSJSON {
  trackers: Record<string, TDSTrackerEntry>;
  entities: Record<string, TDSEntity>;
}

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(
  DIR_NAME,
  "..",
  "src",
  "data",
  "tracker-map.json"
);
const TDS_URL =
  "https://staticcdn.duckduckgo.com/trackerblocking/v6/current/android-tds.json";

async function fetchTDS(): Promise<TDSJSON> {
  console.log(`Fetching TDS from ${TDS_URL}...`);
  const response = await fetch(TDS_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch TDS: ${response.status} ${response.statusText}`
    );
  }
  return response.json() as Promise<TDSJSON>;
}

function normalizeTrackerMap(tds: TDSJSON): Record<string, TrackerEntry> {
  const map: Record<string, TrackerEntry> = {};

  for (const [domain, entry] of Object.entries(tds.trackers)) {
    if (!entry.owner?.name) {
      continue;
    }

    const category = entry.categories?.[0] || "Unknown";
    map[domain] = {
      domain,
      owner: entry.owner.name,
      category,
      prevalence: entry.prevalence,
    };
  }

  return map;
}

async function buildTrackerMap(): Promise<void> {
  try {
    const tds = await fetchTDS();
    const trackerMap = normalizeTrackerMap(tds);

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    fs.mkdirSync(outputDir, { recursive: true });

    // Write the map as JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(trackerMap, null, 2), "utf-8");

    const entryCount = Object.keys(trackerMap).length;
    const fileSizeKB = (fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2);

    console.log(`✓ Generated tracker map: ${OUTPUT_PATH}`);
    console.log(`  Entries: ${entryCount}`);
    console.log(`  Size: ${fileSizeKB} KB`);
  } catch (error) {
    console.error("Error building tracker map:", error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
}

void buildTrackerMap();
