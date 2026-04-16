import { cn } from "@/lib/utils";

import { DUAL_SCAN_VIEW } from "../constants/report-page.constants";
import type { BrowserPaneProps } from "../types/report-page.types";
import { RequestFeed } from "./request-feed";

const TRAFFIC_LIGHTS = ["bg-red-400/60", "bg-yellow-400/60", "bg-green-400/60"];

export function BrowserPane({
  label,
  hostname,
  progress,
  requests,
  isProtected,
  isComplete,
}: BrowserPaneProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Pane label */}
      <div
        className={cn(
          "px-3 py-1.5 text-center text-xs font-semibold",
          isProtected
            ? "bg-brand/10 text-brand"
            : "bg-muted text-muted-foreground",
        )}
      >
        {label}
      </div>

      {/* Fake browser chrome bar */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <div className="flex gap-1">
          {TRAFFIC_LIGHTS.map((cls) => (
            <div key={cls} className={cn("size-2.5 rounded-full", cls)} />
          ))}
        </div>
        <div className="flex-1 truncate rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {hostname}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3 pt-2 pb-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-150",
              isProtected ? "bg-brand" : "bg-foreground/40",
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {isComplete
            ? DUAL_SCAN_VIEW.COMPLETE_LABEL
            : `${Math.round(progress)}%`}
        </p>
      </div>

      {/* Scrolling request feed */}
      <RequestFeed requests={requests} isProtected={isProtected} />
    </div>
  );
}
