import { describe, expect, it } from "vitest";

import { isPrivateOrReservedHost } from "./private-host";

describe("isPrivateOrReservedHost", () => {
  it("flags localhost", () => {
    expect(isPrivateOrReservedHost("localhost")).toBe(true);
  });

  it("flags 127.0.0.1", () => {
    expect(isPrivateOrReservedHost("127.0.0.1")).toBe(true);
  });

  it("flags 10.0.0.1", () => {
    expect(isPrivateOrReservedHost("10.0.0.1")).toBe(true);
  });

  it("flags 192.168.1.1", () => {
    expect(isPrivateOrReservedHost("192.168.1.1")).toBe(true);
  });

  it("flags 172.16.0.1", () => {
    expect(isPrivateOrReservedHost("172.16.0.1")).toBe(true);
  });

  it("allows public hostnames", () => {
    expect(isPrivateOrReservedHost("example.com")).toBe(false);
  });
});
