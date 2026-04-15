import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../services/crawl.service.js', () => ({ executeCrawl: vi.fn(), getActiveJobs: vi.fn(() => 0) }));
vi.mock('../security/ssrf-guard.js', () => ({ ssrfGuard: vi.fn() }));
vi.mock('../env.js', () => ({ env: { maxConcurrentJobs: 3 } }));

import { handleCrawl } from './crawl.controller.js';
import { executeCrawl, getActiveJobs } from '../services/crawl.service.js';
import { ssrfGuard } from '../security/ssrf-guard.js';
import { SsrfError } from '../errors/index.js';

const next = vi.fn() as unknown as NextFunction;

function makeReqRes(body: unknown) {
  const req = { body, app: { locals: { trackerMap: {} } } } as unknown as Request;
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return { req, res };
}

describe('handleCrawl', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns 202 for valid request', async () => {
    vi.mocked(ssrfGuard).mockResolvedValue(undefined);
    vi.mocked(getActiveJobs).mockReturnValue(0);
    const { req, res } = makeReqRes({ url: 'https://example.com', reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(202);
    expect(executeCrawl).toHaveBeenCalled();
  });

  it('returns 400 for missing url', async () => {
    const { req, res } = makeReqRes({ reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(400);
  });

  it('returns 400 on SSRF rejection', async () => {
    vi.mocked(ssrfGuard).mockRejectedValue(new SsrfError('private IP'));
    const { req, res } = makeReqRes({ url: 'http://192.168.1.1', reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(400);
  });

  it('returns 503 when at concurrency cap', async () => {
    vi.mocked(ssrfGuard).mockResolvedValue(undefined);
    vi.mocked(getActiveJobs).mockReturnValue(3);
    const { req, res } = makeReqRes({ url: 'https://example.com', reportId: 'r1', callbackUrl: 'https://web.app/cb' });
    await handleCrawl(req, res, next);
    expect((res.status as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(503);
  });
});
