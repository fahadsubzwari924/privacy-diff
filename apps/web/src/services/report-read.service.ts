import { API_ERROR_CODES } from "../constants/index";
import * as reportRepo from "../db/report-repository";
import type { PublicReport, Report } from "../db/report.types";
import { reportIdParamSchema } from "../lib/schemas/report-id.schema";
import type { JsonServiceResult } from "../types/service-http.types";

function validationError(details: unknown): JsonServiceResult {
  return {
    status: 400,
    body: {
      code: API_ERROR_CODES.VALIDATION_ERROR,
      message: "Invalid report id",
      details,
    },
  };
}

function notFoundError(): JsonServiceResult {
  return {
    status: 404,
    body: {
      code: API_ERROR_CODES.NOT_FOUND,
      message: "Report not found",
    },
  };
}

function parseAndValidateId(
  rawId: string,
): { id: string } | JsonServiceResult {
  const result = reportIdParamSchema.safeParse(rawId);
  if (!result.success) {
    return validationError(result.error.flatten().fieldErrors);
  }
  return { id: result.data };
}

function serializeFull(report: Report): PublicReport & Record<string, unknown> {
  return {
    id: report.id,
    url: report.url,
    status: report.status,
    error: report.error,
    finalUrl: report.finalUrl,
    pageTitle: report.pageTitle,
    unprotectedRequests: report.unprotectedRequests,
    unprotectedBytes: report.unprotectedBytes,
    unprotectedLoadMs: report.unprotectedLoadMs,
    protectedRequests: report.protectedRequests,
    protectedBytes: report.protectedBytes,
    protectedLoadMs: report.protectedLoadMs,
    blockedRequests: report.blockedRequests,
    companies: report.companies,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

function serializePending(report: Report): Record<string, unknown> {
  return {
    id: report.id,
    status: report.status,
    error: report.error,
  };
}

export async function getReportById(rawId: string): Promise<JsonServiceResult> {
  const validated = parseAndValidateId(rawId);
  if ("status" in validated) return validated;

  const report = await reportRepo.findReportById(validated.id);
  if (!report) return notFoundError();

  if (report.status !== "done") {
    return { status: 200, body: serializePending(report) };
  }
  return { status: 200, body: serializeFull(report) };
}

export async function getReportStatus(rawId: string): Promise<JsonServiceResult> {
  const validated = parseAndValidateId(rawId);
  if ("status" in validated) return validated;

  const row = await reportRepo.findReportStatus(validated.id);
  if (!row) return notFoundError();

  const body: Record<string, unknown> = { status: row.status };
  if (row.error) body.error = row.error;
  if (row.status === 'done') {
    body.blockedCount = row.blockedRequests?.length ?? 0;
  }
  return { status: 200, body };
}
