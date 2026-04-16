"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DUAL_SCAN_VIEW } from "../constants/report-page.constants";
import { useRubberBandProgress } from "../hooks/use-rubber-band-progress";
import { useFakeRequestFeed } from "../hooks/use-fake-request-feed";
import type { DualScanViewProps } from "../types/report-page.types";
import { BrowserPane } from "./browser-pane";

type ScanState = "scanning" | "revealing" | "navigating";

type StatusResponse = {
  status: string;
  error?: string;
  blockedCount?: number;
};

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function DualScanView({ reportId, targetUrl }: DualScanViewProps) {
  const router = useRouter();
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [blockedCount, setBlockedCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);

  const isComplete = scanState !== "scanning";
  const hostname = extractHostname(targetUrl);

  const progress = useRubberBandProgress(isComplete);
  const unprotectedFeed = useFakeRequestFeed(hostname, isComplete);
  const protectedFeed = useFakeRequestFeed(hostname, isComplete);

  // ── Polling ──────────────────────────────────────────────────────────────
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/report/${reportId}/status`);
      if (!res.ok) return;
      const data = (await res.json()) as StatusResponse;

      if (data.status === "done") {
        setBlockedCount(data.blockedCount ?? 0);
        setScanState("revealing");
      } else if (data.status === "error") {
        router.refresh();
      }
    } catch {
      // network blip — keep polling
    }
  }, [reportId, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      void checkStatus();
    }, DUAL_SCAN_VIEW.POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [checkStatus]);

  // ── Auto-navigate after reveal ────────────────────────────────────────────
  useEffect(() => {
    if (scanState !== "revealing") return;
    const timer = setTimeout(() => {
      setScanState("navigating");
      router.refresh();
    }, DUAL_SCAN_VIEW.REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [scanState, router]);

  // ── Counter animation ─────────────────────────────────────────────────────
  const counterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scanState !== "revealing") return;
    // displayCount is already initialised to 0; nothing to animate for zero
    if (blockedCount === 0) return;

    const stepDuration =
      DUAL_SCAN_VIEW.COUNTER_DURATION_MS / DUAL_SCAN_VIEW.COUNTER_STEPS;
    const increment = Math.ceil(blockedCount / DUAL_SCAN_VIEW.COUNTER_STEPS);
    let current = 0;

    counterRef.current = setInterval(() => {
      current = Math.min(current + increment, blockedCount);
      setDisplayCount(current);
      if (current >= blockedCount && counterRef.current) {
        clearInterval(counterRef.current);
      }
    }, stepDuration);

    return () => {
      if (counterRef.current) clearInterval(counterRef.current);
    };
  }, [scanState, blockedCount]);

  // ── Render ────────────────────────────────────────────────────────────────
  const revealVisible = scanState === "revealing" || scanState === "navigating";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 text-center">
        <p className="text-lg font-semibold">
          {DUAL_SCAN_VIEW.HEADING_PREFIX} {hostname}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {DUAL_SCAN_VIEW.SCANNING_SUBTITLE}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BrowserPane
          label={DUAL_SCAN_VIEW.PANE_UNPROTECTED_LABEL}
          hostname={hostname}
          progress={progress}
          requests={unprotectedFeed}
          isProtected={false}
          isComplete={isComplete}
        />
        <BrowserPane
          label={DUAL_SCAN_VIEW.PANE_PROTECTED_LABEL}
          hostname={hostname}
          progress={progress}
          requests={protectedFeed}
          isProtected={true}
          isComplete={isComplete}
        />
      </div>

      {/* Reveal section */}
      <div
        className="mt-8 flex flex-col items-center gap-1 text-center"
        style={{
          opacity: revealVisible ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        {blockedCount > 0 ? (
          <>
            <p className="text-5xl font-extrabold tabular-nums text-foreground">
              {displayCount}
            </p>
            <p className="text-sm text-muted-foreground">
              {DUAL_SCAN_VIEW.BLOCKED_SUFFIX}
            </p>
          </>
        ) : (
          <p className="text-base font-medium text-muted-foreground">
            {DUAL_SCAN_VIEW.ZERO_BLOCKED_LABEL}
          </p>
        )}
      </div>
    </div>
  );
}
