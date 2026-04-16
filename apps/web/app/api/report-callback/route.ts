import { NextResponse } from "next/server";

import { postReportCallback } from "@/src/services/report-callback.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const result = await postReportCallback(request);
  return NextResponse.json(result.body, { status: result.status });
}
