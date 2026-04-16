import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findCachedReport: vi.fn(),
  createReport: vi.fn(),
  updateReportStatus: vi.fn(),
  countRecentRateEvents: vi.fn(),
  insertRateLimitEvent: vi.fn(),
  notifyCrawlerAccepted: vi.fn(),
}));

vi.mock("../../env", () => ({
  env: {
    rateLimitMaxPerHour: 10,
    crawlerUrl: "http://crawler.test",
    crawlerSharedSecret: "secret",
    publicBaseUrl: "http://localhost:3000/",
  },
}));

vi.mock("../db/report-repository", () => ({
  findCachedReport: mocks.findCachedReport,
  createReport: mocks.createReport,
  updateReportStatus: mocks.updateReportStatus,
}));

vi.mock("../db/rate-limit-repository", () => ({
  countRecentRateEvents: mocks.countRecentRateEvents,
  insertRateLimitEvent: mocks.insertRateLimitEvent,
}));

vi.mock("../lib/crawler", () => ({
  notifyCrawlerAccepted: mocks.notifyCrawlerAccepted,
}));

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

import { postAnalyze } from "./analyze.service";

describe("postAnalyze", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findCachedReport.mockResolvedValue(null);
    mocks.countRecentRateEvents.mockResolvedValue(0);
    mocks.notifyCrawlerAccepted.mockResolvedValue(true);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await postAnalyze(req);
    expect(res.status).toBe(400);
  });

  it("returns cached report", async () => {
    mocks.findCachedReport.mockResolvedValue({
      id: "example-com-abc123",
      status: "done",
    });
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.1",
      },
    });
    const res = await postAnalyze(req);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      reportId: "example-com-abc123",
      cached: true,
    });
    expect(mocks.createReport).not.toHaveBeenCalled();
  });

  it("returns 429 when over rate limit", async () => {
    mocks.countRecentRateEvents.mockResolvedValue(10);
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.2",
      },
    });
    const res = await postAnalyze(req);
    expect(res.status).toBe(429);
    expect(mocks.createReport).not.toHaveBeenCalled();
  });

  it("returns 503 when crawler rejects", async () => {
    mocks.notifyCrawlerAccepted.mockResolvedValue(false);
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com" }),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.3",
      },
    });
    const res = await postAnalyze(req);
    expect(res.status).toBe(503);
    expect(mocks.updateReportStatus).toHaveBeenCalledWith(
      expect.any(String),
      "error",
      "crawler unreachable",
    );
  });

  it("returns 202 when crawl is accepted", async () => {
    const req = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ url: "https://example.com/page" }),
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.4",
      },
    });
    const res = await postAnalyze(req);
    expect(res.status).toBe(202);
    expect(res.body.cached).toBe(false);
    expect(typeof res.body.reportId).toBe("string");
    expect(mocks.insertRateLimitEvent).toHaveBeenCalled();
    expect(mocks.notifyCrawlerAccepted).toHaveBeenCalled();
  });
});
