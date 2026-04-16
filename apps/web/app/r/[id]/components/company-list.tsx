"use client";

import { useState } from "react";

import {
  COMPANY_LIST,
  buildShowAllLabel,
} from "../constants/report-page.constants";
import type { CompanyListProps } from "../types/report-page.types";

const CATEGORY_COLORS: Record<string, string> = {
  Advertising: "bg-red-100 text-red-700",
  Analytics: "bg-blue-100 text-blue-700",
  Social: "bg-purple-100 text-purple-700",
  "Content Delivery": "bg-gray-100 text-gray-600",
  Fingerprinting: "bg-orange-100 text-orange-700",
  "Customer Interaction": "bg-green-100 text-green-700",
};

const FALLBACK_CATEGORY_CLASS = "bg-muted text-muted-foreground";

function categoryClass(cat: string): string {
  return CATEGORY_COLORS[cat] ?? FALLBACK_CATEGORY_CLASS;
}

export function CompanyList({ companies }: CompanyListProps) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...companies].sort((a, b) => b.requestCount - a.requestCount);
  const visible = showAll ? sorted : sorted.slice(0, COMPANY_LIST.TOP_N);
  const hasMore = sorted.length > COMPANY_LIST.TOP_N;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {COMPANY_LIST.SECTION_HEADING}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {visible.map((company) => (
          <div
            key={company.name}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-sm font-medium">
                {company.name}
              </span>
              <div className="flex flex-wrap gap-1">
                {company.categories.map((cat) => (
                  <span
                    key={cat}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryClass(cat)}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <span className="ml-4 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
              {company.requestCount} {COMPANY_LIST.REQ_SUFFIX}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-sm text-brand hover:underline"
        >
          {showAll
            ? COMPANY_LIST.SHOW_LESS
            : buildShowAllLabel(sorted.length)}
        </button>
      )}
    </section>
  );
}
