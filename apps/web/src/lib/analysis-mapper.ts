import type { AnalysisResult } from "@privacy-diff/shared";

import type { UpdateReportResultsInput } from "../db/report.types";

function ownerPrevalence(owner: string, blocked: AnalysisResult["blocked"]): number {
  const ownerRequests = blocked.filter((b) => b.tracker.owner === owner);
  if (ownerRequests.length === 0) return 0;

  const withPrevalence = ownerRequests.filter(
    (b) => typeof b.tracker.prevalence === "number",
  );
  if (withPrevalence.length === 0) return 0;

  const sum = withPrevalence.reduce(
    (acc, b) => acc + (b.tracker.prevalence ?? 0),
    0,
  );
  return sum / withPrevalence.length;
}

export function analysisResultToUpdateInput(
  data: AnalysisResult,
): UpdateReportResultsInput {
  const companies = data.byOwner.map((o) => ({
    name: o.owner,
    requestCount: o.requestCount,
    categories: o.allCategories,
    prevalence: ownerPrevalence(o.owner, data.blocked),
  }));

  return {
    status: "done",
    finalUrl: data.finalUrl,
    pageTitle: data.pageTitle,
    unprotectedRequests: data.unprotected.requestCount,
    unprotectedBytes: data.unprotected.totalBytes,
    unprotectedLoadMs: data.unprotected.loadTimeMs,
    protectedRequests: data.protected.requestCount,
    protectedBytes: data.protected.totalBytes,
    protectedLoadMs: data.protected.loadTimeMs,
    blockedRequests: data.blocked.map((b) => ({
      url: b.url,
      owner: b.tracker.owner,
      category: b.tracker.category,
    })),
    companies,
  };
}
