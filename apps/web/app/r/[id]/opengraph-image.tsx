import { ImageResponse } from "next/og";

import { findReportById } from "@/src/db/report-repository";
import { OG_IMAGE } from "./constants/report-page.constants";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = { params: Promise<{ id: string }> };

export default async function OgImage({ params }: Props) {
  const { id } = await params;
  const report = await findReportById(id);

  const blockedCount = report?.blockedRequests?.length ?? 0;
  const companyCount = report?.companies?.length ?? 0;

  let host = report?.url ?? "";
  try {
    host = new URL(report?.url ?? "").hostname;
  } catch {
    // keep raw url as fallback
  }

  const watchingLabel =
    companyCount === 1 ? OG_IMAGE.COMPANY_SINGULAR : OG_IMAGE.COMPANY_PLURAL;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "80px",
        }}
      >
        <div style={{ fontSize: 28, color: "#9ca3af", marginBottom: 24 }}>
          {OG_IMAGE.BRAND_NAME}
        </div>

        <div
          style={{
            fontSize: 88,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          {blockedCount}
        </div>

        <div
          style={{
            fontSize: 40,
            fontWeight: 600,
            color: "#e07a5f",
            marginTop: 8,
          }}
        >
          {OG_IMAGE.TRACKERS_BLOCKED_LABEL}
        </div>

        <div style={{ fontSize: 28, color: "#6b7280", marginTop: 12 }}>
          {OG_IMAGE.ON_PREPOSITION} {host}
        </div>

        <div style={{ fontSize: 22, color: "#9ca3af", marginTop: 16 }}>
          {companyCount} {watchingLabel}
        </div>

        <div
          style={{
            marginTop: 48,
            padding: "14px 36px",
            background: "#e07a5f",
            color: "#ffffff",
            borderRadius: 9999,
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          {OG_IMAGE.CTA_TEXT}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
