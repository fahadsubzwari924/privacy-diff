import { Button } from "@/components/ui/button";
import { DOWNLOAD_CTA } from "../constants/report-page.constants";

export function DownloadCTA() {
  return (
    <section className="rounded-xl bg-brand/10 px-6 py-8 text-center ring-1 ring-brand/20">
      <h2 className="text-lg font-bold">{DOWNLOAD_CTA.HEADING}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{DOWNLOAD_CTA.BODY}</p>
      <a
        href={DOWNLOAD_CTA.DDG_APP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex"
      >
        <Button className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
          {DOWNLOAD_CTA.BUTTON_TEXT}
        </Button>
      </a>
    </section>
  );
}
