import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { findReportById } from "@/src/db/report-repository";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/app/components/site-header/site-header";
import { SiteFooter } from "@/app/components/site-footer/site-footer";

import { DualScanView } from "./components/dual-scan-view";
import { ReportError } from "./components/report-error";
import { HeroStat } from "./components/hero-stat";
import { MetricsCompare } from "./components/metrics-compare";
import { CompanyList } from "./components/company-list";
import { CategoryChart } from "./components/category-chart";
import { DownloadCTA } from "./components/download-cta";
import { ShareButton } from "./components/share-button";
import {
  METADATA,
  REPORT_PAGE,
  buildMetadataTitle,
  buildMetadataDescription,
} from "./constants/report-page.constants";

type PageProps = { params: Promise<{ id: string }> };

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await findReportById(id);

  if (report?.status !== "done") {
    return { title: METADATA.ANALYZING_TITLE };
  }

  const blockedCount = report.blockedRequests?.length ?? 0;
  const companyCount = report.companies?.length ?? 0;
  const host = extractHostname(report.url);
  const title = buildMetadataTitle(blockedCount, host);
  const description = buildMetadataDescription(companyCount);

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await findReportById(id);

  if (!report) notFound();

  const headerActions = (
    <>
      <ShareButton />
      <Link href="/">
        <Button
          size="sm"
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {REPORT_PAGE.ANALYZE_LINK_TEXT}
        </Button>
      </Link>
    </>
  );

  if (report.status === "error") {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader backHref="/" actions={headerActions} />
        <ReportError error={report.error} url={report.url} />
        <SiteFooter />
      </div>
    );
  }

  if (report.status !== "done") {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader backHref="/" />
        <DualScanView reportId={id} targetUrl={report.url} />
      </div>
    );
  }

  const blockedCount = report.blockedRequests?.length ?? 0;
  const companyCount = report.companies?.length ?? 0;
  const bytesSaved =
    report.unprotectedBytes !== null && report.protectedBytes !== null
      ? report.unprotectedBytes - report.protectedBytes
      : null;
  const timeSavedMs =
    report.unprotectedLoadMs !== null && report.protectedLoadMs !== null
      ? report.unprotectedLoadMs - report.protectedLoadMs
      : null;

  const hostname = extractHostname(report.url);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader backHref="/" actions={headerActions} />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-4 py-10">
        <div>
          <p className="text-sm text-muted-foreground">
            {REPORT_PAGE.REPORT_FOR_LABEL}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{hostname}</h1>
          {report.pageTitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {report.pageTitle}
            </p>
          )}
        </div>

        <HeroStat
          blockedCount={blockedCount}
          companyCount={companyCount}
          bytesSaved={bytesSaved}
          timeSavedMs={timeSavedMs}
        />

        <MetricsCompare
          unprotectedRequests={report.unprotectedRequests}
          unprotectedBytes={report.unprotectedBytes}
          unprotectedLoadMs={report.unprotectedLoadMs}
          protectedRequests={report.protectedRequests}
          protectedBytes={report.protectedBytes}
          protectedLoadMs={report.protectedLoadMs}
        />

        {report.companies && report.companies.length > 0 && (
          <CompanyList companies={report.companies} />
        )}

        {report.blockedRequests && report.blockedRequests.length > 0 && (
          <CategoryChart blockedRequests={report.blockedRequests} />
        )}

        <DownloadCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
