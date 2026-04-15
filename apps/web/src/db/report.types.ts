export type ReportStatus = 'queued' | 'running' | 'done' | 'error';

export interface BlockedRequest {
  url: string;
  owner: string;
  category: string;
}

export interface CompanySummary {
  name: string;
  requestCount: number;
  categories: string[];
  prevalence: number;
}

export interface Report {
  id: string;
  url: string;
  urlHash: string;
  weekBucket: string;
  status: ReportStatus;
  error: string | null;
  finalUrl: string | null;
  pageTitle: string | null;
  unprotectedRequests: number | null;
  unprotectedBytes: number | null;
  unprotectedLoadMs: number | null;
  protectedRequests: number | null;
  protectedBytes: number | null;
  protectedLoadMs: number | null;
  blockedRequests: BlockedRequest[] | null;
  companies: CompanySummary[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportInput {
  id: string;
  url: string;
  urlHash: string;
  weekBucket: string;
  status: ReportStatus;
}

export interface UpdateReportResultsInput {
  finalUrl?: string;
  pageTitle?: string;
  unprotectedRequests?: number;
  unprotectedBytes?: number;
  unprotectedLoadMs?: number;
  protectedRequests?: number;
  protectedBytes?: number;
  protectedLoadMs?: number;
  blockedRequests?: BlockedRequest[];
  companies?: CompanySummary[];
  status: ReportStatus;
  error?: string;
}
