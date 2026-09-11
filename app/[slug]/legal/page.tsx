/**
 * Legal page — CNDP/Loi 09-08 compliance.
 * Documents what's collected, why, retention, and right-to-erasure.
 */
import { notFound } from "next/navigation";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import type { Metadata } from "next";

type RouteParams = { slug: string };

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Mentions légales introuvables" };
  return {
    title: `Mentions légales & Confidentialité — ${salon.businessName}`,
    robots: { index: true, follow: true },
  };
}

export default async function LegalPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold">Mentions légales & Confidentialité</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">{salon.businessName}</p>

      <section className="mt-8 space-y-6 leading-relaxed text-[var(--color-text)]">
        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données à caractère personnel collectées via cette page est
            {" "}<strong>{salon.businessName}</strong>. Pour toute demande relative à vos données,
            contactez <a href="mailto:privacy@resernova.com" className="text-[var(--color-primary-500)] underline">privacy@resernova.com</a>.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <ul className="list-disc space-y-1 pl-6">
            <li>Nom complet et numéro de téléphone (obligatoires pour confirmer votre réservation)</li>
            <li>Adresse e-mail (optionnelle, pour recevoir la confirmation)</li>
            <li>Adresse IP (hachée SHA-256, conservée 24 h uniquement pour la sécurité anti-spam)</li>
            <li>User-agent et referrer du navigateur (audit technique)</li>
          </ul>
        </Section>

        <Section title="3. Finalités">
          <p>Les données sont utilisées exclusivement pour :</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Créer et gérer votre réservation</li>
            <li>Vous envoyer un rappel 24 h avant votre rendez-vous (si vous y avez consenti)</li>
            <li>Prévenir les abus (rate-limiting, anti-bot)</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>
            Le traitement est fondé sur votre <strong>consentement</strong> (cases à cocher explicites)
            et sur l'<strong>exécution du contrat</strong> de réservation.
          </p>
        </Section>

        <Section title="5. Durée de conservation">
          <ul className="list-disc space-y-1 pl-6">
            <li>Données de réservation : conservées tant que la relation contractuelle dure</li>
            <li>Adresse IP (hachée) : 24 heures, puis supprimée automatiquement</li>
            <li>Cookies : aucun cookie de tracking n'est déposé sur cette page</li>
          </ul>
        </Section>

        <Section title="6. Vos droits (Loi 09-08)">
          <p>
            Conformément à la loi marocaine 09-08, vous disposez d'un droit d'<strong>accès</strong>,
            de <strong>rectification</strong>, d'<strong>opposition</strong> et de{" "}
            <strong>suppression</strong> de vos données. Pour exercer ces droits, écrivez à
            {" "}<a href="mailto:privacy@resernova.com" className="text-[var(--color-primary-500)] underline">privacy@resernova.com</a>{" "}
            — nous traiterons votre demande dans un délai maximum de 30 jours.
          </p>
        </Section>

        <Section title="7. Sécurité">
          <p>
            Toutes les communications sont chiffrées en TLS 1.3. Les jetons d'auto-gestion sont signés
            par HMAC-SHA256 et expirent après 7 jours. Aucun mot de passe n'est nécessaire pour gérer
            votre réservation.
          </p>
        </Section>

        <Section title="8. Hébergement">
          <p>
            Les données sont hébergées chez Supabase Inc. (infrastructure cloud sécurisée, certifications
            SOC 2 Type II et ISO 27001). Les serveurs sont localisés en Europe.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Pour toute question, réclamation ou demande d'exercice de vos droits :
            {" "}<a href="mailto:privacy@resernova.com" className="text-[var(--color-primary-500)] underline">privacy@resernova.com</a>
          </p>
        </Section>
      </section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      <div className="mt-3 text-[var(--color-text)]/90">{children}</div>
    </div>
  );
}