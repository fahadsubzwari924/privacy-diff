import { describe, expect, it } from 'vitest';

import { normalizeUrl, urlHash } from './url-normalizer';

describe('normalizeUrl', () => {
  it('strips utm_source', () => {
    const result = normalizeUrl('https://example.com/?utm_source=google');
    expect(result).toBe('https://example.com/');
  });

  it('strips all tracking params at once', () => {
    const result = normalizeUrl(
      'https://example.com/page?utm_source=fb&utm_medium=cpc&utm_campaign=sale&fbclid=abc&gclid=xyz',
    );
    expect(result).toBe('https://example.com/page');
  });

  it('preserves non-tracking query params', () => {
    const result = normalizeUrl('https://example.com/search?q=hello&page=2');
    expect(result).toBe('https://example.com/search?q=hello&page=2');
  });

  it('strips URL hash fragment', () => {
    const result = normalizeUrl('https://example.com/page#section');
    expect(result).toBe('https://example.com/page');
  });

  it('preserves trailing slash on root path', () => {
    const result = normalizeUrl('https://example.com/');
    expect(result).toBe('https://example.com/');
  });

  it('strips trailing slash from non-root path', () => {
    const result = normalizeUrl('https://example.com/blog/post/');
    expect(result).toBe('https://example.com/blog/post');
  });

  it('preserves path without trailing slash unchanged', () => {
    const result = normalizeUrl('https://example.com/blog/post');
    expect(result).toBe('https://example.com/blog/post');
  });

  it('throws on invalid URL', () => {
    expect(() => normalizeUrl('not-a-url')).toThrow();
  });
});

describe('urlHash', () => {
  it('returns a 64-character hex sha256', () => {
    const hash = urlHash('https://example.com/');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces the same hash for the same input', () => {
    const a = urlHash('https://example.com/page');
    const b = urlHash('https://example.com/page');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', () => {
    const a = urlHash('https://example.com/page-a');
    const b = urlHash('https://example.com/page-b');
    expect(a).not.toBe(b);
  });

  it('two URLs that normalize to the same value produce the same hash', () => {
    const normalized = normalizeUrl('https://example.com/?utm_source=google');
    const hashA = urlHash(normalized);
    const hashB = urlHash('https://example.com/');
    expect(hashA).toBe(hashB);
  });
});
