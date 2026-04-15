import type { AnalysisResult, TrackerOwnerSummary } from '@privacy-diff/shared';
import type { SessionResult } from './types.js';

export function buildResult(
  unprotected: SessionResult,
  protectedSession: SessionResult,
  url: string,
  partial: boolean,
): AnalysisResult {
  const bytesSaved = Math.max(0, unprotected.metrics.totalBytes - protectedSession.metrics.totalBytes);
  const loadTimeSavedMs = Math.max(0, unprotected.metrics.loadTimeMs - protectedSession.metrics.loadTimeMs);

  const ownerMap = new Map<string, TrackerOwnerSummary>();
  for (const req of protectedSession.blockedList) {
    const { owner, category } = req.tracker;
    const existing = ownerMap.get(owner);
    if (existing) {
      existing.requestCount += 1;
      if (!existing.domains.includes(req.hostname)) existing.domains.push(req.hostname);
      if (!existing.allCategories.includes(category)) existing.allCategories.push(category);
    } else {
      ownerMap.set(owner, {
        owner,
        primaryCategory: category,
        requestCount: 1,
        domains: [req.hostname],
        allCategories: [category],
      });
    }
  }
  const byOwner = [...ownerMap.values()].sort((a, b) => b.requestCount - a.requestCount);

  const categories: Record<string, number> = {};
  for (const req of protectedSession.blockedList) {
    const cat = req.tracker.category;
    categories[cat] = (categories[cat] ?? 0) + 1;
  }

  return {
    url,
    finalUrl: protectedSession.finalUrl,
    pageTitle: protectedSession.pageTitle,
    partial,
    unprotected: unprotected.metrics,
    protected: protectedSession.metrics,
    totalRequests: unprotected.metrics.requestCount,
    blockedRequests: protectedSession.blockedList.length,
    bytesSaved,
    loadTimeSavedMs,
    blocked: protectedSession.blockedList,
    byOwner,
    categories,
    crawledAt: new Date().toISOString(),
  };
}
