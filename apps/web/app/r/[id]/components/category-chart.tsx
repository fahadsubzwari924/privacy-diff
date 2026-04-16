import { CATEGORY_CHART } from "../constants/report-page.constants";
import type { CategoryChartProps } from "../types/report-page.types";

export function CategoryChart({ blockedRequests }: CategoryChartProps) {
  const counts = blockedRequests.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] ?? 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const max = entries[0][1];

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {CATEGORY_CHART.SECTION_HEADING}
      </h2>
      <div className="space-y-3">
        {entries.map(([category, count]) => (
          <div key={category} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-right text-sm text-muted-foreground">
              {category}
            </span>
            <div className="h-6 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand/70"
                style={{ width: `${(count / max) * 100}%` }}
                role="presentation"
              />
            </div>
            <span className="w-8 shrink-0 text-sm font-medium tabular-nums">
              {count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
