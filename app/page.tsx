/**
 * Root landing page — Linear-style editorial restraint.
 *
 * Top-level structure (each section separated by a hairline rule):
 *   1. LandingHero         — bilingual headline + Cal.com-style live preview
 *   2. SalonsSection       — directory grid of web-enabled salons
 *   3. Benefits            — 3 alternating two-column rows with proof chips
 *   4. HowItWorks          — 3-column monospace-numbered cards
 *   5. TrustStrip          — 6 muted salon logos (text wordmarks for MVP)
 *   6. LandingFooter       — 4-column sparse
 *
 * Display weight is `font-medium` (500), NEVER `font-bold`.
 * All colors come from the `@theme` tokens defined in `app/globals.css`.
 */
import Link from "next/link";
import { LandingHero } from "@/components/marketing/LandingHero";
import { SalonCard } from "@/components/marketing/SalonCard";
import { Button } from "@/components/ui/Button";
import { getAllPublicSalons } from "@/server/queries/getAllPublicSalons";

export const revalidate = 300;

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
    <main className="min-h-dvh bg-canvas pb-16 text-ink">
      <LandingHero salonCount={salons.length} />

      <HairlineRule />

      <SalonsSection hasSalons={hasSalons}>
        {hasSalons ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {salons.map((salon) => (
              <SalonCard key={salon.slug} salon={salon} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </SalonsSection>

      <HairlineRule />

      <Benefits />

      <HairlineRule />

      <HowItWorks />

      <HairlineRule />

      <TrustStrip />

      <LandingFooter />
    </main>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function HairlineRule() {
  return <hr className="mx-auto max-w-6xl border-0 border-t border-border" />;
}

/* ──────────────────────────────────────────────────────────────────────────── */

function SalonsSection({
  hasSalons,
  children,
}: {
  hasSalons: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id="salons"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24"
      aria-labelledby="salons-heading"
    >
      <header className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
            Annuaire
          </p>
          <h2
            id="salons-heading"
            className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1"
          >
            Salons disponibles
          </h2>
        </div>
        {hasSalons && (
          <Link
            href="#how"
            className="hidden text-body-sm font-medium text-ink-muted transition-base duration-base ease-standard hover:text-ink md:inline"
          >
            Comment ça marche →
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center">
      <p className="font-display text-h4 font-medium text-ink">
        Aucun salon n&apos;a encore activé la réservation en ligne.
      </p>
      <p className="mt-2 text-body text-ink-muted">
        Vous dirigez un salon de beauté au Maroc ?
      </p>
      <a href="mailto:contact@resernova.com" className="mt-6 inline-flex">
        <Button variant="primary">Activer ReserNova pour mon salon</Button>
      </a>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function Benefits() {
  const rows = [
    {
      eyebrow: "Réservation",
      title: "Vos clients réservent en 30 secondes.",
      body: "Aucun compte à créer, aucune app à télécharger. Le client choisit un service, un créneau, et laisse son nom + téléphone. Terminé.",
      proof: "−87% d'allers-retours WhatsApp",
      rightSlot: <BenefitsVisualCalendar />,
    },
    {
      eyebrow: "Gestion",
      title: "Un seul agenda pour toute l'équipe.",
      body: "Disponibilités, pauses, jours fériés, Ramadan — ReserNova synchronise votre planning avec les créneaux réellement réservables, et notifie votre équipe dès qu'une nouvelle réservation tombe.",
      proof: "0 feuille Excel, 0 oubli",
      rightSlot: <BenefitsVisualStaff />,
    },
    {
      eyebrow: "Marketing",
      title: "Un lien à coller dans votre bio Instagram.",
      body: "Chaque salon ReserNova dispose d'une URL publique — book.resernova.com/<votre-slug> — prête à partager. Le client clique, réserve, vous voyez la demande arriver dans votre tableau de bord.",
      proof: "Lien partageable + QR code",
      rightSlot: <BenefitsVisualLink />,
    },
  ] as const;

  return (
    <section
      id="benefits"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24"
      aria-labelledby="benefits-heading"
    >
      <header className="mb-16 max-w-2xl">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
          Pourquoi ReserNova
        </p>
        <h2
          id="benefits-heading"
          className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1"
        >
          Tout ce qu&apos;il faut pour remplir votre agenda.
        </h2>
      </header>

      <div className="space-y-20">
        {rows.map((row, i) => (
          <div
            key={row.title}
            className={`grid grid-cols-1 items-center gap-10 md:grid-cols-2 ${
              i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
                {row.eyebrow}
              </p>
              <h3 className="mt-3 font-display text-h3 font-medium leading-snug text-ink md:text-h2">
                {row.title}
              </h3>
              <p className="mt-4 max-w-md text-body-lg leading-relaxed text-ink-muted">
                {row.body}
              </p>
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-caption font-medium text-ink">
                <span aria-hidden className="text-accent">
                  ✓
                </span>
                {row.proof}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
              {row.rightSlot}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Inline mini-visuals — restrained, monochrome, accent reserved for emphasis. */
function BenefitsVisualCalendar() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-caption text-ink-muted">
        <span className="font-mono">Semaine 38</span>
        <span>Lun → Dim</span>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={`${d}-${i}`} className="text-center">
            <span className="font-mono text-caption text-ink-soft">{d}</span>
            <div
              className={`mt-1 h-10 rounded-sm border ${
                [1, 3, 5].includes(i)
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-surface"
              }`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-caption text-ink-muted">
        <span className="inline-block size-2 rounded-sm bg-accent" />
        Créneaux réservés
        <span className="ml-auto inline-block size-2 rounded-sm border border-border bg-surface" />
        Disponibles
      </div>
    </div>
  );
}

function BenefitsVisualStaff() {
  const staff = [
    { name: "Sara", bookings: 12, accent: true },
    { name: "Yassine", bookings: 9 },
    { name: "Khadija", bookings: 7 },
  ];
  return (
    <ul className="space-y-3">
      {staff.map((s) => (
        <li
          key={s.name}
          className={`flex items-center justify-between rounded-md border p-3 ${
            s.accent
              ? "border-accent bg-accent-soft"
              : "border-border bg-canvas"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid size-9 place-items-center rounded-full font-mono text-caption ${
                s.accent ? "bg-accent text-ink-inverse" : "bg-surface text-ink"
              }`}
            >
              {s.name.charAt(0)}
            </span>
            <div>
              <p className="font-display text-body font-medium text-ink">
                {s.name}
              </p>
              <p className="font-mono text-caption text-ink-muted">
                {s.bookings} RDV cette semaine
              </p>
            </div>
          </div>
          <span className="font-mono text-caption text-ink-soft">●</span>
        </li>
      ))}
    </ul>
  );
}

function BenefitsVisualLink() {
  const url = "book.resernova.com/mon-salon";
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-surface p-4">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-ink-muted">
          Votre lien public
        </p>
        <p className="mt-2 truncate font-mono text-body text-ink">{url}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border bg-canvas p-3">
          <p className="font-mono text-eyebrow uppercase tracking-wider text-ink-muted">
            Instagram
          </p>
          <p className="mt-1 text-caption text-ink">Collez dans votre bio →</p>
        </div>
        <div className="rounded-md border border-border bg-canvas p-3">
          <p className="font-mono text-eyebrow uppercase tracking-wider text-ink-muted">
            QR code
          </p>
          <p className="mt-1 text-caption text-ink">
            Téléchargeable, imprimable
          </p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Trouvez votre salon",
      d: "Parcourez la liste des salons partenaires ou collez le lien reçu par votre salon.",
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
    <section
      id="how"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24"
      aria-labelledby="how-heading"
    >
      <header className="mb-12 max-w-2xl">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
          Comment ça marche
        </p>
        <h2
          id="how-heading"
          className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1"
        >
          Trois étapes. Pas de compte.
        </h2>
        <p className="mt-4 text-body-lg leading-relaxed text-ink-muted">
          Pas de mot de passe. Pas d&apos;app à installer.
        </p>
      </header>

      <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <p className="font-mono text-3xl font-medium text-accent">{s.n}</p>
            <h3 className="mt-4 font-display text-h4 font-medium text-ink">
              {s.t}
            </h3>
            <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
              {s.d}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function TrustStrip() {
  const salons = [
    "Atelier Yasmine",
    "Belacqua Spa",
    "Maison Lina",
    "Studio Karim",
    "Esthecare",
    "Riad & Co.",
  ];
  return (
    <section
      aria-label="Salons qui utilisent ReserNova"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6"
    >
      <p className="text-center font-mono text-eyebrow uppercase tracking-wider text-ink-muted">
        Adopté par les salons et spas au Maroc
      </p>
      <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {salons.map((name) => (
          <li
            key={name}
            className="flex h-12 items-center justify-center rounded-md border border-border bg-canvas px-4"
          >
            <span className="truncate font-display text-body-sm font-medium text-ink-muted">
              {name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

function LandingFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-12 pt-20 sm:px-6">
      <div className="grid grid-cols-2 gap-10 border-t border-border pt-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="font-display text-body font-medium text-ink">
            ReserNova
          </p>
          <p className="mt-2 max-w-xs text-caption leading-relaxed text-ink-muted">
            Plateforme de réservation pour salons, spas et bien-être au Maroc.
          </p>
        </div>

        <FooterCol
          heading="Produit"
          links={[
            { label: "Salons", href: "#salons" },
            { label: "Comment ça marche", href: "#how" },
            { label: "Démarrer", href: "mailto:contact@resernova.com" },
          ]}
        />
        <FooterCol
          heading="Légal"
          links={[
            { label: "Confidentialité", href: "/legal" },
            { label: "Cookies", href: "/legal#cookies" },
          ]}
        />
        <FooterCol
          heading="Contact"
          links={[
            {
              label: "contact@resernova.com",
              href: "mailto:contact@resernova.com",
            },
            { label: "resernova.com ↗", href: "https://resernova.com" },
          ]}
        />
      </div>

      <p className="mt-12 text-caption text-ink-soft">
        © {new Date().getFullYear()} ReserNova. Tous droits réservés.
      </p>
    </footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="font-mono text-eyebrow uppercase tracking-wider text-ink-muted">
        {heading}
      </p>
      <ul className="mt-4 space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-body-sm text-ink transition-base duration-base ease-standard hover:text-accent"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
