import { randomBytes } from 'crypto';

const RANDOM_HEX_LENGTH = 3; // produces 6 hex characters

export function makeSlug(url: string): string {
  const hostname = new URL(url).hostname
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const suffix = randomBytes(RANDOM_HEX_LENGTH).toString('hex');

  return `${hostname}-${suffix}`;
}
