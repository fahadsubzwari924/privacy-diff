import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyzeForm } from "@/app/components/analyze-form/analyze-form";
import { SiteHeader } from "@/app/components/site-header/site-header";
import { SiteFooter } from "@/app/components/site-footer/site-footer";

const HERO = {
  HEADING: "Privacy Diff",
  SUBHEADING: "See who's watching you on any site.",
} as const;

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "We load your page twice",
    description:
      "Once in an unprotected browser — the way most people browse — and once with DuckDuckGo's tracker blocklist active.",
  },
  {
    step: "2",
    title: "We capture every network call",
    description:
      "Every third-party request is recorded: analytics, ads, social widgets, fingerprinting scripts, and more.",
  },
  {
    step: "3",
    title: "We show you exactly who was watching",
    description:
      "Side-by-side diff of blocked vs. unblocked trackers, powered by DuckDuckGo's open Tracker Radar data.",
  },
] as const;

const HOW_IT_WORKS_HEADING = "How it works";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 pt-16 pb-16 text-center sm:pt-24">
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {HERO.HEADING}
          </h1>
          <p className="mb-10 max-w-md text-lg text-muted-foreground">
            {HERO.SUBHEADING}
          </p>

          <div className="w-full max-w-xl">
            <AnalyzeForm />
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-2xl px-4">
          <hr className="border-border" />
        </div>

        {/* How it works */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {HOW_IT_WORKS_HEADING}
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <Card key={step} size="sm">
                <CardHeader>
                  <div className="mb-1 flex size-7 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                    {step}
                  </div>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
