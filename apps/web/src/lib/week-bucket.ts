const UTC_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

/**
 * Returns the ISO 8601 week bucket for the given date, e.g. "2026-W16".
 * Exported for unit testing; call currentWeekBucket() in application code.
 */
export function getIsoWeekBucket(date: Date): string {
  // Use Intl to extract UTC date parts — avoids local timezone shifts
  const formatted = UTC_DATE_FORMATTER.format(date); // "YYYY-MM-DD"
  const [year, month, day] = formatted.split('-').map(Number);

  // ISO 8601: set to Thursday of the current week (weeks start Monday)
  // getUTCDay() → 0=Sun…6=Sat; convert so Mon=1…Sun=7
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const isoDay = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(day + (4 - isoDay));

  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const dayOfYear = Math.round((utcDate.getTime() - yearStart.getTime()) / 86_400_000);
  const weekNum = Math.ceil((dayOfYear + 1) / 7);

  return `${isoYear}-W${String(weekNum).padStart(2, '0')}`;
}

export function currentWeekBucket(): string {
  return getIsoWeekBucket(new Date());
}
