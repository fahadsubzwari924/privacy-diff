import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authMiddleware } from "./auth.middleware.js";

vi.mock("../env.js", () => ({
  env: { crawlerSharedSecret: "test-secret" },
}));

function makeReq(authHeader?: string): Partial<Request> {
  return { headers: { authorization: authHeader } };
}

function makeRes(): { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

describe("authMiddleware", () => {
  it("calls next() when token is correct", () => {
    const next = vi.fn() as NextFunction;
    authMiddleware(makeReq("Bearer test-secret") as Request, makeRes() as unknown as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when token is wrong", () => {
    const res = makeRes();
    const next = vi.fn() as NextFunction;
    authMiddleware(makeReq("Bearer wrong") as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when header is missing", () => {
    const res = makeRes();
    const next = vi.fn() as NextFunction;
    authMiddleware(makeReq(undefined) as Request, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
