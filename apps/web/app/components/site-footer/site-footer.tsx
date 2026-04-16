import { SITE_FOOTER } from "@/app/r/[id]/constants/report-page.constants";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
      {SITE_FOOTER.BUILT_ON_PREFIX}{" "}
      <a
        href={SITE_FOOTER.TRACKER_RADAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {SITE_FOOTER.TRACKER_RADAR_LABEL}
      </a>
      .
    </footer>
  );
}
