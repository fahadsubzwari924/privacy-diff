import { and, eq } from 'drizzle-orm';

import { db } from './index';
import { reports } from './schema';
import type {
  CreateReportInput,
  Report,
  ReportStatus,
  ReportStatusRow,
  UpdateReportResultsInput,
} from './report.types';

export async function findCachedReport(
  urlHash: string,
  weekBucket: string,
): Promise<Report | null> {
  const rows = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.urlHash, urlHash),
        eq(reports.weekBucket, weekBucket),
        eq(reports.status, 'done' satisfies ReportStatus),
      ),
    )
    .limit(1);

  return (rows[0] as Report) ?? null;
}

export async function createReport(input: CreateReportInput): Promise<Report> {
  const rows = await db
    .insert(reports)
    .values({
      id: input.id,
      url: input.url,
      urlHash: input.urlHash,
      weekBucket: input.weekBucket,
      status: input.status,
    })
    .returning();

  return rows[0] as Report;
}

export async function findReportById(id: string): Promise<Report | null> {
  const rows = await db
    .select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);

  return (rows[0] as Report) ?? null;
}

export async function findReportStatus(
  id: string,
): Promise<ReportStatusRow | null> {
  const rows = await db
    .select({
      id: reports.id,
      status: reports.status,
      error: reports.error,
      blockedRequests: reports.blockedRequests,
    })
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);

  return (rows[0] as ReportStatusRow) ?? null;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  error?: string,
): Promise<void> {
  await db
    .update(reports)
    .set({
      status,
      error: error ?? null,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, id));
}

export async function updateReportResults(
  id: string,
  input: UpdateReportResultsInput,
): Promise<void> {
  await db
    .update(reports)
    .set({
      status: input.status,
      error: input.error ?? null,
      finalUrl: input.finalUrl,
      pageTitle: input.pageTitle,
      unprotectedRequests: input.unprotectedRequests,
      unprotectedBytes: input.unprotectedBytes,
      unprotectedLoadMs: input.unprotectedLoadMs,
      protectedRequests: input.protectedRequests,
      protectedBytes: input.protectedBytes,
      protectedLoadMs: input.protectedLoadMs,
      blockedRequests: input.blockedRequests,
      companies: input.companies,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, id));
}
