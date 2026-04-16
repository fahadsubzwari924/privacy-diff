import { describe, expect, it } from 'vitest';

import { makeSlug } from './slug-generator';

describe('makeSlug', () => {
  it('matches the pattern hostname-slug-{6hex}', () => {
    const slug = makeSlug('https://cnn.com/');
    expect(slug).toMatch(/^[a-z0-9-]+-[0-9a-f]{6}$/);
  });

  it('lowercases the hostname', () => {
    const slug = makeSlug('https://CNN.COM/');
    expect(slug).toMatch(/^cnn-com-[0-9a-f]{6}$/);
  });

  it('replaces dots and special characters with dashes', () => {
    const slug = makeSlug('https://www.bbc.co.uk/');
    expect(slug).toMatch(/^www-bbc-co-uk-[0-9a-f]{6}$/);
  });

  it('produces unique slugs on repeated calls for the same URL', () => {
    const a = makeSlug('https://example.com/');
    const b = makeSlug('https://example.com/');
    expect(a).not.toBe(b);
  });

  it('produces no leading or trailing dashes in the hostname part', () => {
    const slug = makeSlug('https://example.com/');
    const [hostnamePart] = slug.split(/-[0-9a-f]{6}$/);
    expect(hostnamePart).not.toMatch(/^-|-$/);
  });

  it('throws on invalid URL', () => {
    expect(() => makeSlug('not-a-url')).toThrow();
  });
});
