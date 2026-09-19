/**
 * Root layout — fonts, theme, providers.
 * Sentry init handled in lib/utils/sentry (loaded lazily).
 */
import type { Metadata, Viewport } from "next";
import { Inter, Tajawal, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./focus.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-tajawal",
  weight: ["400", "500", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://book.resernova.com",
  ),
  title: {
    default: "ReserNova — Réservez votre rendez-vous",
    template: "%s · ReserNova",
  },
  description: "Réservez votre prochain rendez-vous beauté en quelques clics.",
  openGraph: {
    type: "website",
    locale: "fr_MA",
    siteName: "ReserNova",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      dir="ltr"
      data-theme="light"
      className={`${inter.variable} ${tajawal.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh bg-canvas font-sans text-base text-ink antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
