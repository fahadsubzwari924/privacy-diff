import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatBytes, formatCount, formatMs } from "../lib/format-utils";
import { METRICS_COMPARE } from "../constants/report-page.constants";
import type { MetricsCompareProps } from "../types/report-page.types";

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function MetricsCompare({
  unprotectedRequests,
  unprotectedBytes,
  unprotectedLoadMs,
  protectedRequests,
  protectedBytes,
  protectedLoadMs,
}: MetricsCompareProps) {
  const empty = METRICS_COMPARE.EMPTY_VALUE;

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {METRICS_COMPARE.SECTION_HEADING}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive/80">
              {METRICS_COMPARE.UNPROTECTED_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <MetricRow
              label={METRICS_COMPARE.LABEL_REQUESTS}
              value={
                unprotectedRequests !== null
                  ? formatCount(unprotectedRequests)
                  : empty
              }
            />
            <MetricRow
              label={METRICS_COMPARE.LABEL_DATA}
              value={
                unprotectedBytes !== null ? formatBytes(unprotectedBytes) : empty
              }
            />
            <MetricRow
              label={METRICS_COMPARE.LABEL_LOAD_TIME}
              value={
                unprotectedLoadMs !== null ? formatMs(unprotectedLoadMs) : empty
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-brand">
              {METRICS_COMPARE.PROTECTED_TITLE}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <MetricRow
              label={METRICS_COMPARE.LABEL_REQUESTS}
              value={
                protectedRequests !== null
                  ? formatCount(protectedRequests)
                  : empty
              }
            />
            <MetricRow
              label={METRICS_COMPARE.LABEL_DATA}
              value={
                protectedBytes !== null ? formatBytes(protectedBytes) : empty
              }
            />
            <MetricRow
              label={METRICS_COMPARE.LABEL_LOAD_TIME}
              value={
                protectedLoadMs !== null ? formatMs(protectedLoadMs) : empty
              }
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
