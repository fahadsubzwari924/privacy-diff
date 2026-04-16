import { describe, expect, it } from "vitest";

import { analyzeBodySchema } from "./analyze-body.schema";

describe("analyzeBodySchema", () => {
  it("accepts https URL", () => {
    const r = analyzeBodySchema.safeParse({
      url: "https://example.com/path",
    });
    expect(r.success).toBe(true);
  });

  it("rejects private IP URL", () => {
    const r = analyzeBodySchema.safeParse({
      url: "http://127.0.0.1:8080/",
    });
    expect(r.success).toBe(false);
  });

  it("rejects extra fields", () => {
    const r = analyzeBodySchema.safeParse({
      url: "https://example.com",
      foo: 1,
    });
    expect(r.success).toBe(false);
  });
});
