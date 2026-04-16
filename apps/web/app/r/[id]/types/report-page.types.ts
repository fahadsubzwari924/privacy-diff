import type { BlockedRequest, CompanySummary } from "@/src/db/report.types";

export type { BlockedRequest, CompanySummary };

export interface HeroStatProps {
  blockedCount: number;
  companyCount: number;
  bytesSaved: number | null;
  timeSavedMs: number | null;
}

export interface MetricsCompareProps {
  unprotectedRequests: number | null;
  unprotectedBytes: number | null;
  unprotectedLoadMs: number | null;
  protectedRequests: number | null;
  protectedBytes: number | null;
  protectedLoadMs: number | null;
}

export interface CompanyListProps {
  companies: CompanySummary[];
}

export interface CategoryChartProps {
  blockedRequests: BlockedRequest[];
}

export interface ReportErrorProps {
  error: string | null;
  url: string;
}

export interface DualScanViewProps {
  reportId: string;
  targetUrl: string;
}

export interface FakeRequest {
  id: number;
  domain: string;
  isTracker: boolean;
}

export interface BrowserPaneProps {
  label: string;
  hostname: string;
  progress: number;
  requests: FakeRequest[];
  isProtected: boolean;
  isComplete: boolean;
}

export interface RequestFeedProps {
  requests: FakeRequest[];
  isProtected: boolean;
}
