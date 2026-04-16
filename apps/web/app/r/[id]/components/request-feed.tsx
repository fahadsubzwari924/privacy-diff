import { cn } from "@/lib/utils";

import type { RequestFeedProps } from "../types/report-page.types";

const BLOCKED_ICON = "🚫";
const ALLOWED_ICON = "↓";
const FIRST_PARTY_ICON = "✓";

export function RequestFeed({ requests, isProtected }: RequestFeedProps) {
  return (
    <div className="min-h-[168px] space-y-1 overflow-hidden px-3 pb-3">
      {requests.map((req) => {
        const isBlocked = isProtected && req.isTracker;
        let icon = ALLOWED_ICON;
        if (isBlocked) icon = BLOCKED_ICON;
        else if (isProtected && !req.isTracker) icon = FIRST_PARTY_ICON;

        return (
          <div key={req.id} className="flex items-center gap-2 text-xs">
            <span className="shrink-0">{icon}</span>
            <span
              className={cn(
                "truncate font-mono",
                isBlocked
                  ? "text-muted-foreground/60 line-through"
                  : "text-foreground/80",
              )}
            >
              {req.domain}
            </span>
          </div>
        );
      })}
    </div>
  );
}
