/**
 * Per-salon Open Graph image (1200×630).
 * Renders at build/request time via Next.js `ImageResponse`.
 */
import { ImageResponse } from "next/og";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);

  const title = salon?.businessName ?? "Salon introuvable";
  const subtitle = salon?.description ?? "Réservez votre rendez-vous en ligne";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: 80,
          backgroundImage: "linear-gradient(135deg, #1C6B6D 0%, #2A9D8F 50%, #3ABDA2 100%)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: 0.85 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {title.charAt(0).toUpperCase()}
          </div>
          <div style={{ fontSize: 22 }}>ReserNova</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: 1000,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, opacity: 0.9, maxWidth: 900 }}>{subtitle}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 28px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: 9999,
            fontSize: 24,
            fontWeight: 600,
            alignSelf: "flex-start",
          }}
        >
          Réserver maintenant →
        </div>
      </div>
    ),
    { ...size },
  );
}