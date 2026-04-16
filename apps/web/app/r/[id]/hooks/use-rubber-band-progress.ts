import { useEffect, useRef, useState } from "react";

import { DUAL_SCAN_VIEW } from "../constants/report-page.constants";

const TICK_MS = 100;

/**
 * Returns a progress value (0–100) that advances quickly at first,
 * then slows to a stall, and snaps to 100 only when isComplete is true.
 * The animated state never artificially reaches 100 — the snap is derived
 * from the isComplete flag so no setState is needed inside the effect.
 */
export function useRubberBandProgress(isComplete: boolean): number {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isComplete) return;

    startTimeRef.current = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const isSlow = elapsed > DUAL_SCAN_VIEW.PROGRESS_STALL_THRESHOLD_MS;
      const rate = isSlow
        ? DUAL_SCAN_VIEW.PROGRESS_SLOW_RATE
        : DUAL_SCAN_VIEW.PROGRESS_FAST_RATE;

      setAnimatedProgress((prev) => {
        if (prev >= DUAL_SCAN_VIEW.PROGRESS_NATURAL_CAP) return prev;
        return Math.min(prev + rate, DUAL_SCAN_VIEW.PROGRESS_NATURAL_CAP);
      });
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [isComplete]);

  // Snap to 100 via derivation — no setState needed in effect body
  return isComplete ? 100 : animatedProgress;
}
