import { NextResponse } from "next/server";

import { postAnalyze } from "@/src/services/analyze.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const result = await postAnalyze(request);
  return NextResponse.json(result.body, { status: result.status });
}
