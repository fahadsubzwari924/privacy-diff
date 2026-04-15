import { describe, expect, it } from 'vitest';

import { getIsoWeekBucket } from './week-bucket';

describe('getIsoWeekBucket', () => {
  it('returns format YYYY-Www', () => {
    const result = getIsoWeekBucket(new Date('2026-04-15T00:00:00Z'));
    expect(result).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('returns correct week for a known mid-year date', () => {
    // 2026-04-15 is a Wednesday in ISO week 16
    expect(getIsoWeekBucket(new Date('2026-04-15T00:00:00Z'))).toBe('2026-W16');
  });

  it('returns W01 for 2026-01-01 (falls in week 1)', () => {
    // 2026-01-01 is a Thursday — it IS the definition of week 1
    expect(getIsoWeekBucket(new Date('2026-01-01T00:00:00Z'))).toBe('2026-W01');
  });

  it('handles year-boundary: 2024-12-30 belongs to 2025-W01', () => {
    // 2024-12-30 is a Monday; its Thursday is 2025-01-02 → year 2025, week 1
    expect(getIsoWeekBucket(new Date('2024-12-30T00:00:00Z'))).toBe('2025-W01');
  });

  it('handles year-boundary: 2025-01-01 belongs to 2025-W01', () => {
    // 2025-01-01 is a Wednesday; Thursday is 2025-01-02 → year 2025, week 1
    expect(getIsoWeekBucket(new Date('2025-01-01T00:00:00Z'))).toBe('2025-W01');
  });

  it('handles year-boundary: 2020-12-31 belongs to 2020-W53', () => {
    // 2020-12-31 is a Thursday; belongs to 2020-W53
    expect(getIsoWeekBucket(new Date('2020-12-31T00:00:00Z'))).toBe('2020-W53');
  });

  it('pads single-digit week numbers with a leading zero', () => {
    // 2026-01-05 is a Monday in week 2
    const result = getIsoWeekBucket(new Date('2026-01-05T00:00:00Z'));
    expect(result).toMatch(/-W\d{2}$/);
  });

  it('returns same bucket for all days of the same ISO week', () => {
    // Week 16 of 2026: Mon 2026-04-13 … Sun 2026-04-19
    const days = [
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
      '2026-04-18',
      '2026-04-19',
    ].map((d) => getIsoWeekBucket(new Date(`${d}T12:00:00Z`)));

    expect(new Set(days).size).toBe(1);
    expect(days[0]).toBe('2026-W16');
  });
});
