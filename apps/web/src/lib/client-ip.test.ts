import { describe, expect, it } from "vitest";

import { rateLimitIdentityFromHeaders } from "./client-ip";

describe("rateLimitIdentityFromHeaders", () => {
  it("hashes first x-forwarded-for hop", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.5, 10.0.0.1",
    });
    const a = rateLimitIdentityFromHeaders(headers);
    const b = rateLimitIdentityFromHeaders(headers);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("uses unknown when header missing", () => {
    const headers = new Headers();
    const a = rateLimitIdentityFromHeaders(headers);
    const b = rateLimitIdentityFromHeaders(headers);
    expect(a).toBe(b);
  });
});
