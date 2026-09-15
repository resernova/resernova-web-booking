/**
 * Root landing page — marketing + discovery.
 *
 * Fetches every web-enabled salon from `service_providers_public`
 * (Migration 015) and renders them in a responsive grid below the
 * brand-true teal hero.
 */
import Link from "next/link";
import { LandingHero } from "@/components/marketing/LandingHero";
import { SalonCard } from "@/components/marketing/SalonCard";
import { getAllPublicSalons } from "@/server/queries/getAllPublicSalons";

export const revalidate = 300;
export const dynamic = "force-dynamic"; // ensures fresh salons on each request

export const metadata = {
  title: "ReserNova — Réservez votre prochain rendez-vous beauté",
  description:
    "Plateforme de réservation en ligne pour salons de beauté, spas et bien-être au Maroc. Réservez en quelques clics.",
  openGraph: {
    title: "ReserNova — Réservez votre prochain rendez-vous beauté",
    description:
      "Plateforme de réservation en ligne pour salons de beauté au Maroc.",
    type: "website",
  },
};

export default async function HomePage() {
  const salons = await getAllPublicSalons();
  const hasSalons = salons.length > 0;

  return (
    <main className="min-h-dvh pb-16">
      <LandingHero salonCount={salons.length} />

      {/* Salon directory (overlapping the hero curve) */}
      <section id="salons" className="mx-auto -mt-8 max-w-6xl px-4 sm:px-6">
        <div className="glass rounded-3xl px-4 py-8 shadow-card sm:px-8 sm:py-10">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Salons disponibles
            </h2>
          </div>

          {hasSalons ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {salons.map((salon) => (
                <SalonCard key={salon.slug} salon={salon} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </section>

      {/* How it works (lightweight explainer) */}
      <HowItWorks />

      {/* Footer */}
      <LandingFooter />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-zinc-50 p-12 text-center">
      <p className="font-display text-lg font-semibold text-[var(--color-text)]">
        Aucun salon n'a encore activé la réservation en ligne.
      </p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        Vous dirigez un salon de beauté au Maroc ?
      </p>
      <a
        href="mailto:contact@resernova.com"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-5 py-2.5 text-sm font-semibold text-white shadow-button"
      >
        Activer ReserNova pour mon salon
      </a>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Trouvez votre salon",
      d: "Parcourez la liste des salons partenaires ou collez le lien de réservation reçu par votre salon.",
    },
    {
      n: "02",
      t: "Choisissez le créneau",
      d: "Sélectionnez le service, la date et l'heure qui vous conviennent. Aucune création de compte requise.",
    },
    {
      n: "03",
      t: "Confirmez en 30 secondes",
      d: "Nom, téléphone, et c'est fait. Vous recevez une confirmation par e-mail avec ajout au calendrier.",
    },
  ];
  return (
    <section id="how" className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
      <h2 className="font-display text-center text-3xl font-semibold">
        Comment ça marche
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--color-text-muted)]">
        Trois étapes. Pas de compte. Pas de mot de passe. Pas d'app à installer.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-card"
          >
            <div className="font-display text-4xl font-bold text-[var(--color-primary-500)]/30">
              {s.n}
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold">{s.t}</h3>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="mx-auto mt-20 max-w-5xl px-4 pb-12 sm:px-6">
      <div className="border-t border-[var(--color-border)] pt-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-sm font-semibold">ReserNova</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Plateforme de réservation pour salons, spas et bien-être au Maroc.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <Link
              href="/legal"
              className="hover:text-[var(--color-primary-500)]"
            >
              Confidentialité
            </Link>
            <a
              href="mailto:contact@resernova.com"
              className="hover:text-[var(--color-primary-500)]"
            >
              Contact
            </a>
            <a
              href="https://resernova.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-primary-500)]"
            >
              resernova.com ↗
            </a>
          </div>
        </div>
        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} ReserNova. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
