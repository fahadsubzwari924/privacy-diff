import { describe, it, expect, vi } from 'vitest';
import { createInterceptHandler } from './request-interceptor.js';
import type { TrackerEntry } from '@privacy-diff/shared';

const trackerMap: Record<string, TrackerEntry> = {
  'doubleclick.net': { domain: 'doubleclick.net', owner: 'Google LLC', category: 'Advertising' },
};

describe('createInterceptHandler', () => {
  it('aborts and records when block=true and tracker found', () => {
    const blocked: string[] = [];
    const route = { request: () => ({ url: () => 'https://doubleclick.net/pixel' }), abort: vi.fn(), continue: vi.fn() };
    const handler = createInterceptHandler({ block: true, trackerMap, onBlocked: (r) => blocked.push(r.hostname) });
    handler(route as never);
    expect(route.abort).toHaveBeenCalled();
    expect(route.continue).not.toHaveBeenCalled();
    expect(blocked).toContain('doubleclick.net');
  });

  it('continues when block=false regardless of tracker match', () => {
    const route = { request: () => ({ url: () => 'https://doubleclick.net/pixel' }), abort: vi.fn(), continue: vi.fn() };
    const handler = createInterceptHandler({ block: false, trackerMap, onBlocked: vi.fn() });
    handler(route as never);
    expect(route.continue).toHaveBeenCalled();
    expect(route.abort).not.toHaveBeenCalled();
  });

  it('continues when no tracker match', () => {
    const route = { request: () => ({ url: () => 'https://example.com/img.png' }), abort: vi.fn(), continue: vi.fn() };
    const handler = createInterceptHandler({ block: true, trackerMap, onBlocked: vi.fn() });
    handler(route as never);
    expect(route.continue).toHaveBeenCalled();
  });
});
