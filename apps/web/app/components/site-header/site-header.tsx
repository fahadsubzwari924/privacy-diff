import Link from "next/link";

import { SITE_HEADER } from "@/app/r/[id]/constants/report-page.constants";

import type { SiteHeaderProps } from "./site-header.types";

export function SiteHeader({ backHref, actions }: SiteHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-brand"
          >
            <span aria-hidden="true">{SITE_HEADER.BACK_ARROW}</span>
            <span>{SITE_HEADER.BRAND_NAME}</span>
          </Link>
        ) : (
          <span className="text-sm font-semibold text-foreground">
            {SITE_HEADER.BRAND_NAME}
          </span>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
