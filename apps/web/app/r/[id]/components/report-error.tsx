import Link from "next/link";

import {
  REPORT_ERROR,
  buildBlockedSiteError,
} from "../constants/report-page.constants";
import type { ReportErrorProps } from "../types/report-page.types";

export function ReportError({ error, url }: ReportErrorProps) {
  let host = url;
  try {
    host = new URL(url).hostname;
  } catch {
    // keep raw url as fallback
  }

  const isBlockedSite =
    error?.includes("load") === true || error?.includes("timeout") === true;

  const body = isBlockedSite
    ? buildBlockedSiteError(host)
    : REPORT_ERROR.GENERIC_BODY;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-4xl" aria-hidden="true">
        ⚠️
      </p>
      <h2 className="text-xl font-semibold">{REPORT_ERROR.HEADING}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{body}</p>
      <Link href="/" className="text-sm text-brand hover:underline">
        {REPORT_ERROR.TRY_ANOTHER_LINK}
      </Link>
    </div>
  );
}
