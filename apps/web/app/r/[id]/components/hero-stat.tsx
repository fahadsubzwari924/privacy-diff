import { formatBytes, formatMs } from "../lib/format-utils";
import { HERO_STAT } from "../constants/report-page.constants";
import type { HeroStatProps } from "../types/report-page.types";

export function HeroStat({
  blockedCount,
  companyCount,
  bytesSaved,
  timeSavedMs,
}: HeroStatProps) {
  if (blockedCount === 0) {
    return (
      <section className="rounded-xl bg-muted px-6 py-8 text-center">
        <p className="text-4xl" aria-hidden="true">
          🎉
        </p>
        <h2 className="mt-3 text-2xl font-bold">{HERO_STAT.ZERO_HEADING}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{HERO_STAT.ZERO_BODY}</p>
      </section>
    );
  }

  const hasSavings =
    bytesSaved !== null &&
    timeSavedMs !== null &&
    bytesSaved > 0 &&
    timeSavedMs > 0;

  const companyNoun =
    companyCount === 1 ? HERO_STAT.COMPANY_SINGULAR : HERO_STAT.COMPANY_PLURAL;

  return (
    <section className="rounded-xl bg-brand/10 px-6 py-8 text-center ring-1 ring-brand/20">
      <p className="text-6xl font-extrabold tracking-tight text-foreground sm:text-7xl">
        {blockedCount}
      </p>
      <p className="mt-2 text-xl font-semibold text-brand">
        {HERO_STAT.TRACKERS_BLOCKED_LABEL}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {HERO_STAT.FROM_LABEL} {companyCount} {companyNoun}
      </p>
      {hasSavings && (
        <p className="mt-4 text-sm text-muted-foreground">
          {HERO_STAT.SAVINGS_PREFIX}{" "}
          <span className="font-medium text-foreground">
            {formatBytes(bytesSaved!)}
          </span>{" "}
          {HERO_STAT.SAVINGS_DATA_INFIX}{" "}
          <span className="font-medium text-foreground">
            {formatMs(timeSavedMs!)}
          </span>{" "}
          {HERO_STAT.SAVINGS_TIME_SUFFIX}
        </p>
      )}
    </section>
  );
}
