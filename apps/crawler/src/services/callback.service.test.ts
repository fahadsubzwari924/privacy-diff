import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendCallback } from "./callback.service.js";

vi.mock("../env.js", () => ({ env: { crawlerSharedSecret: "test-secret" } }));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("sendCallback", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("sends POST with correct headers on success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
    await sendCallback("https://web.app/callback", {
      reportId: "r1",
      status: "error",
      error: "timeout",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "https://web.app/callback",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-secret" }),
      }),
    );
  });

  it("retries up to 3 times on failure then resolves without throwing", async () => {
    mockFetch.mockRejectedValue(new Error("network error"));
    await expect(
      sendCallback("https://web.app/callback", { reportId: "r1", status: "error", error: "x" }),
    ).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("succeeds on second attempt without exhausting retries", async () => {
    mockFetch.mockRejectedValueOnce(new Error("fail")).mockResolvedValueOnce({ ok: true, status: 200 });
    await sendCallback("https://web.app/callback", { reportId: "r1", status: "error", error: "x" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
