/**
 * Root layout — fonts, theme, providers.
 * Sentry init handled in lib/utils/sentry (loaded lazily).
 */
import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://book.resernova.com"),
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
  themeColor: "#1C6B6D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-dvh bg-surface-muted text-text antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}