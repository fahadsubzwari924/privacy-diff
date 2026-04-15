import { createHash } from 'crypto';

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
  'ref',
] as const;

export function normalizeUrl(input: string): string {
  const u = new URL(input);
  u.hash = '';

  TRACKING_PARAMS.forEach((param) => u.searchParams.delete(param));

  // Normalize trailing slash: keep it only on root path
  if (u.pathname !== '/') {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }

  return u.toString();
}

export function urlHash(normalizedUrl: string): string {
  return createHash('sha256').update(normalizedUrl).digest('hex');
}
