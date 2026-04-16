import { useEffect, useRef, useState } from "react";

import {
  DUAL_SCAN_VIEW,
  FIRST_PARTY_PATHS,
  TRACKER_DOMAINS,
} from "../constants/report-page.constants";
import type { FakeRequest } from "../types/report-page.types";

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const TRACKER_PROBABILITY = 0.7;

/**
 * Generates a stream of fake request rows every REQUEST_FEED_INTERVAL_MS.
 * 70% tracker domains, 30% first-party-like paths.
 * Stops when isComplete is true. Capped at REQUEST_FEED_MAX_VISIBLE rows.
 */
export function useFakeRequestFeed(
  hostname: string,
  isComplete: boolean,
): FakeRequest[] {
  const [rows, setRows] = useState<FakeRequest[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      const isTracker = Math.random() < TRACKER_PROBABILITY;
      const domain = isTracker
        ? randomItem(TRACKER_DOMAINS)
        : `${hostname}/${randomItem(FIRST_PARTY_PATHS)}`;

      const row: FakeRequest = {
        id: ++idRef.current,
        domain,
        isTracker,
      };

      setRows((prev) =>
        [...prev, row].slice(-DUAL_SCAN_VIEW.REQUEST_FEED_MAX_VISIBLE),
      );
    }, DUAL_SCAN_VIEW.REQUEST_FEED_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [hostname, isComplete]);

  return rows;
}
