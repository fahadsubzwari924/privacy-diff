import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  findReportById: vi.fn(),
  findReportStatus: vi.fn(),
}));

vi.mock("../db/report-repository", () => ({
  findReportById: mocks.findReportById,
  findReportStatus: mocks.findReportStatus,
}));

import { getReportById, getReportStatus } from "./report-read.service";

const DONE_REPORT = {
  id: "example-com-abc123",
  url: "https://example.com",
  urlHash: "abc",
  weekBucket: "2026-W16",
  status: "done",
  error: null,
  finalUrl: "https://example.com/",
  pageTitle: "Example Domain",
  unprotectedRequests: 10,
  unprotectedBytes: 5000,
  unprotectedLoadMs: 800,
  protectedRequests: 5,
  protectedBytes: 3000,
  protectedLoadMs: 600,
  blockedRequests: [],
  companies: [],
  createdAt: new Date("2026-04-16T10:00:00Z"),
  updatedAt: new Date("2026-04-16T10:01:00Z"),
};

const PENDING_REPORT = {
  ...DONE_REPORT,
  status: "running",
  finalUrl: null,
  pageTitle: null,
};

describe("getReportById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for invalid id", async () => {
    const res = await getReportById("!!bad!!");
    expect(res.status).toBe(400);
  });

  it("returns 404 when report does not exist", async () => {
    mocks.findReportById.mockResolvedValue(null);
    const res = await getReportById("example-com-abc123");
    expect(res.status).toBe(404);
  });

  it("returns pending shape when status is not done", async () => {
    mocks.findReportById.mockResolvedValue(PENDING_REPORT);
    const res = await getReportById("example-com-abc123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: "example-com-abc123",
      status: "running",
      error: null,
    });
    expect(res.body).not.toHaveProperty("url");
  });

  it("returns full shape when status is done", async () => {
    mocks.findReportById.mockResolvedValue(DONE_REPORT);
    const res = await getReportById("example-com-abc123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("url", "https://example.com");
    expect(res.body).toHaveProperty("finalUrl");
    expect(res.body).toHaveProperty("createdAt");
    expect(res.body).not.toHaveProperty("urlHash");
    expect(res.body).not.toHaveProperty("weekBucket");
  });
});

describe("getReportStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 for invalid id", async () => {
    const res = await getReportStatus("!!bad!!");
    expect(res.status).toBe(400);
  });

  it("returns 404 when report does not exist", async () => {
    mocks.findReportStatus.mockResolvedValue(null);
    const res = await getReportStatus("example-com-abc123");
    expect(res.status).toBe(404);
    expect(mocks.findReportById).not.toHaveBeenCalled();
  });

  it("returns status without error field when no error", async () => {
    mocks.findReportStatus.mockResolvedValue({
      id: "example-com-abc123",
      status: "running",
      error: null,
    });
    const res = await getReportStatus("example-com-abc123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "running" });
    expect(res.body).not.toHaveProperty("error");
  });

  it("includes error field when report errored", async () => {
    mocks.findReportStatus.mockResolvedValue({
      id: "example-com-abc123",
      status: "error",
      error: "crawler unreachable",
    });
    const res = await getReportStatus("example-com-abc123");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "error", error: "crawler unreachable" });
  });
});
