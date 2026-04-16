import { env } from "../../env";
import { API_ERROR_CODES } from "../constants/index";
import * as reportRepo from "../db/report-repository";
import { analysisResultToUpdateInput } from "../lib/analysis-mapper";
import { logger } from "../lib/logger";
import { crawlCallbackBodySchema } from "../lib/schemas/callback.schema";
import type { JsonServiceResult } from "../types/service-http.types";

function bearerToken(headers: Headers): string | null {
  const raw = headers.get("authorization");
  if (!raw?.toLowerCase().startsWith("bearer ")) return null;
  return raw.slice(7).trim();
}

export async function postReportCallback(
  request: Request,
): Promise<JsonServiceResult> {
  const token = bearerToken(request.headers);
  if (!token || token !== env.crawlerSharedSecret) {
    return {
      status: 401,
      body: {
        code: API_ERROR_CODES.UNAUTHORIZED,
        message: "Unauthorized",
      },
    };
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      status: 400,
      body: {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid JSON body",
      },
    };
  }

  const parsed = crawlCallbackBodySchema.safeParse(json);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        code: API_ERROR_CODES.VALIDATION_ERROR,
        message: "Invalid callback payload",
        details: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const payload = parsed.data;
  const existing = await reportRepo.findReportById(payload.reportId);
  if (!existing) {
    logger.warn(
      { reportId: payload.reportId },
      "callback_unknown_report",
    );
    return { status: 200, body: { ok: true } };
  }

  if (payload.status === "error") {
    await reportRepo.updateReportStatus(
      payload.reportId,
      "error",
      payload.error,
    );
  } else {
    await reportRepo.updateReportResults(
      payload.reportId,
      analysisResultToUpdateInput(payload.data),
    );
  }

  logger.info(
    { reportId: payload.reportId, outcome: payload.status },
    "callback_applied",
  );
  return { status: 200, body: { ok: true } };
}
