import { beforeEach, describe, expect, it, vi } from "vitest";
import dns from "dns/promises";
import { ssrfGuard } from "./ssrf-guard.js";
import { SsrfError } from "../errors/index.js";

vi.mock("dns/promises", () => ({
  default: {
    lookup: vi.fn(),
  },
}));

describe("ssrfGuard", () => {
  beforeEach(() => {
    vi.mocked(dns.lookup).mockImplementation(async (hostname: string) => {
      if (hostname === "example.com") {
        return { address: "93.184.216.34", family: 4 };
      }
      if (hostname === "localhost") {
        return { address: "127.0.0.1", family: 4 };
      }
      if (hostname === "127.0.0.1") {
        return { address: "127.0.0.1", family: 4 };
      }
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        return { address: hostname, family: 4 };
      }
      return { address: "8.8.8.8", family: 4 };
    });
  });

  it("rejects invalid URL", async () => {
    await expect(ssrfGuard("")).rejects.toBeInstanceOf(SsrfError);
  });

  it("rejects null input", async () => {
    await expect(ssrfGuard(null as unknown as string)).rejects.toBeInstanceOf(SsrfError);
  });

  it("rejects undefined input", async () => {
    await expect(ssrfGuard(undefined as unknown as string)).rejects.toBeInstanceOf(SsrfError);
  });

  it("rejects non-http/https schemes", async () => {
    await expect(ssrfGuard("ftp://example.com")).rejects.toBeInstanceOf(SsrfError);
  });

  it("rejects localhost", async () => {
    await expect(ssrfGuard("http://localhost/admin")).rejects.toBeInstanceOf(SsrfError);
  });

  it("rejects 127.x.x.x", async () => {
    await expect(ssrfGuard("http://127.0.0.1")).rejects.toBeInstanceOf(SsrfError);
  });

  it("rejects URLs that fail DNS lookup", async () => {
    vi.mocked(dns.lookup).mockRejectedValueOnce(new Error("DNS error"));
    await expect(ssrfGuard("https://invalid-hostname-12345.test")).rejects.toBeInstanceOf(SsrfError);
  });

  it("accepts a public URL", async () => {
    await expect(ssrfGuard("https://example.com")).resolves.toBeUndefined();
  });

  it("rejects private IP addresses (literals)", async () => {
    await expect(ssrfGuard("http://192.168.1.1")).rejects.toBeInstanceOf(SsrfError);
  });
});
