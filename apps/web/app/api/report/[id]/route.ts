import { NextResponse } from "next/server";

import { getReportById } from "@/src/services/report-read.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  // Next.js App Router requires Request as the first parameter even when unused.
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await getReportById(id);
  return NextResponse.json(result.body, { status: result.status });
}
