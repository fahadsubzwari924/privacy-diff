import { describe, it, expect } from 'vitest';
import { buildResult } from './result-builder.js';
import type { SessionResult } from './types.js';

const unprotected: SessionResult = {
  finalUrl: 'https://example.com',
  pageTitle: 'Example',
  botDetected: false,
  metrics: { requestCount: 20, totalBytes: 2000, loadTimeMs: 800 },
  blockedList: [],
};

const protectedSession: SessionResult = {
  finalUrl: 'https://example.com',
  pageTitle: 'Example',
  botDetected: false,
  metrics: { requestCount: 12, totalBytes: 1200, loadTimeMs: 600 },
  blockedList: [
    {
      url: 'doubleclick.net/pixel',
      hostname: 'doubleclick.net',
      tracker: { domain: 'doubleclick.net', owner: 'Google LLC', category: 'Advertising' },
    },
    {
      url: 'connect.facebook.net/en',
      hostname: 'connect.facebook.net',
      tracker: {
        domain: 'connect.facebook.net',
        owner: 'Meta Platforms, Inc.',
        category: 'Social Network',
      },
    },
    {
      url: 'doubleclick.net/ads',
      hostname: 'doubleclick.net',
      tracker: { domain: 'doubleclick.net', owner: 'Google LLC', category: 'Advertising' },
    },
  ],
};

describe('buildResult', () => {
  it('computes diff fields correctly', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', false);
    expect(result.blockedRequests).toBe(3);
    expect(result.bytesSaved).toBe(800);
    expect(result.loadTimeSavedMs).toBe(200);
    expect(result.totalRequests).toBe(20);
  });

  it('groups byOwner correctly', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', false);
    const google = result.byOwner.find((o) => o.owner === 'Google LLC');
    expect(google?.requestCount).toBe(2);
    expect(google?.domains).toContain('doubleclick.net');
    expect(google?.allCategories).toContain('Advertising');
  });

  it('aggregates categories correctly', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', false);
    expect(result.categories['Advertising']).toBe(2);
    expect(result.categories['Social Network']).toBe(1);
  });

  it('clamps negative bytesSaved to 0', () => {
    const result = buildResult(protectedSession, unprotected, 'https://example.com', false);
    expect(result.bytesSaved).toBe(0);
    expect(result.loadTimeSavedMs).toBe(0);
  });

  it('sets partial flag', () => {
    const result = buildResult(unprotected, protectedSession, 'https://example.com', true);
    expect(result.partial).toBe(true);
  });
});
