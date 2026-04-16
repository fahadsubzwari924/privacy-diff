import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findReportById: vi.fn(),
  updateReportStatus: vi.fn(),
  updateReportResults: vi.fn(),
}));

vi.mock("../../env", () => ({
  env: { crawlerSharedSecret: "test-secret" },
}));

vi.mock("../db/report-repository", () => ({
  findReportById: mocks.findReportById,
  updateReportStatus: mocks.updateReportStatus,
  updateReportResults: mocks.updateReportResults,
}));

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

import { postReportCallback } from "./report-callback.service";

const DONE_PAYLOAD = {
  reportId: "example-com-abc123",
  status: "done",
  data: {
    url: "https://example.com",
    finalUrl: "https://example.com/",
    pageTitle: "Example",
    partial: false,
    unprotected: { requestCount: 10, totalBytes: 5000, loadTimeMs: 800 },
    protected: { requestCount: 5, totalBytes: 3000, loadTimeMs: 600 },
    totalRequests: 10,
    blockedRequests: 5,
    bytesSaved: 2000,
    loadTimeSavedMs: 200,
    blocked: [
      {
        url: "https://tracker.com/pixel",
        hostname: "tracker.com",
        tracker: { domain: "tracker.com", owner: "Tracker Inc", category: "Advertising" },
      },
    ],
    byOwner: [
      {
        owner: "Tracker Inc",
        primaryCategory: "Advertising",
        requestCount: 5,
        domains: ["tracker.com"],
        allCategories: ["Advertising"],
      },
    ],
    categories: { Advertising: 5 },
    crawledAt: "2026-04-16T10:00:00.000Z",
  },
};

const ERROR_PAYLOAD = {
  reportId: "example-com-abc123",
  status: "error",
  error: "bot blocked",
};

function makeRequest(body: unknown, authHeader?: string) {
  return new Request("http://localhost/api/report-callback", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });
}

describe("postReportCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findReportById.mockResolvedValue({ id: "example-com-abc123", status: "running" });
    mocks.updateReportStatus.mockResolvedValue(undefined);
    mocks.updateReportResults.mockResolvedValue(undefined);
  });

  it("returns 401 when Authorization header is absent", async () => {
    const res = await postReportCallback(
      makeRequest(DONE_PAYLOAD),
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when bearer token is wrong", async () => {
    const res = await postReportCallback(
      makeRequest(DONE_PAYLOAD, "Bearer wrong-secret"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/report-callback", {
      method: "POST",
      body: "not-json",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-secret",
      },
    });
    const res = await postReportCallback(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid payload shape", async () => {
    const res = await postReportCallback(
      makeRequest({ reportId: "x", status: "unknown" }, "Bearer test-secret"),
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 ok and silences unknown reportId", async () => {
    mocks.findReportById.mockResolvedValue(null);
    const res = await postReportCallback(
      makeRequest(DONE_PAYLOAD, "Bearer test-secret"),
    );
    expect(res.status).toBe(200);
    expect(mocks.updateReportResults).not.toHaveBeenCalled();
    expect(mocks.updateReportStatus).not.toHaveBeenCalled();
  });

  it("calls updateReportResults on done payload", async () => {
    const res = await postReportCallback(
      makeRequest(DONE_PAYLOAD, "Bearer test-secret"),
    );
    expect(res.status).toBe(200);
    expect(mocks.updateReportResults).toHaveBeenCalledWith(
      "example-com-abc123",
      expect.objectContaining({ status: "done" }),
    );
    expect(mocks.updateReportStatus).not.toHaveBeenCalled();
  });

  it("calls updateReportStatus('error') on error payload", async () => {
    const res = await postReportCallback(
      makeRequest(ERROR_PAYLOAD, "Bearer test-secret"),
    );
    expect(res.status).toBe(200);
    expect(mocks.updateReportStatus).toHaveBeenCalledWith(
      "example-com-abc123",
      "error",
      "bot blocked",
    );
    expect(mocks.updateReportResults).not.toHaveBeenCalled();
  });
});
