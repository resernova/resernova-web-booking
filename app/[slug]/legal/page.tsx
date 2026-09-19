/**
 * Legal page — CNDP/Loi 09-08 compliance, token-aligned.
 * Documents what's collected, why, retention, and right-to-erasure.
 */
import { notFound } from "next/navigation";
import { getSalonBySlug } from "@/server/queries/getSalonBySlug";
import { resolveLocale, type Locale } from "@/lib/i18n/config";
import type { Metadata } from "next";

type RouteParams = { slug: string };

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const salon = await getSalonBySlug(slug);
  if (!salon) return { title: "Mentions légales introuvables" };
  return {
    title: `Mentions légales & Confidentialité — ${salon.businessName}`,
    robots: { index: true, follow: true },
  };
}

export default async function LegalPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale: localeRaw } = await searchParams;
  const locale: Locale = resolveLocale(localeRaw ?? null);
  const salon = await getSalonBySlug(slug);
  if (!salon) notFound();

  const t = labels[locale];

  return (
    <main className="bg-canvas text-ink">
      <header className="mx-auto max-w-3xl border-b border-border px-4 py-16 sm:px-6">
        <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
          {t.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {t.heading}
        </h1>
        <p className="mt-3 text-body-lg text-ink-muted">{salon.businessName}</p>
      </header>

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Section eyebrow={t.s1Eyebrow} heading={t.s1Title}>
          <p>
            {t.s1Body1}{" "}
            <strong className="font-medium text-ink">
              {salon.businessName}
            </strong>
            . {t.s1Body2}{" "}
            <a
              href="mailto:privacy@resernova.com"
              className="text-accent underline decoration-accent underline-offset-2 transition-base duration-base ease-standard hover:text-accent-dim"
            >
              privacy@resernova.com
            </a>
            .
          </p>
        </Section>

        <Section eyebrow={t.s2Eyebrow} heading={t.s2Title}>
          <ul className="ml-5 list-disc space-y-1.5 leading-relaxed">
            <li>{t.s2Item1}</li>
            <li>{t.s2Item2}</li>
            <li>{t.s2Item3}</li>
            <li>{t.s2Item4}</li>
          </ul>
        </Section>

        <Section eyebrow={t.s3Eyebrow} heading={t.s3Title}>
          <p>{t.s3Body}</p>
          <ul className="ml-5 mt-3 list-disc space-y-1.5 leading-relaxed">
            <li>{t.s3Item1}</li>
            <li>{t.s3Item2}</li>
            <li>{t.s3Item3}</li>
          </ul>
        </Section>

        <Section eyebrow={t.s4Eyebrow} heading={t.s4Title}>
          <p>
            {t.s4Body1}{" "}
            <strong className="font-medium text-ink">{t.consent}</strong>{" "}
            {t.s4Body2}
          </p>
        </Section>

        <Section eyebrow={t.s5Eyebrow} heading={t.s5Title}>
          <ul className="ml-5 list-disc space-y-1.5 leading-relaxed">
            <li>{t.s5Item1}</li>
            <li>{t.s5Item2}</li>
            <li>{t.s5Item3}</li>
          </ul>
        </Section>

        <Section eyebrow={t.s6Eyebrow} heading={t.s6Title}>
          <p>
            {t.s6Body}{" "}
            <a
              href="mailto:privacy@resernova.com"
              className="text-accent underline decoration-accent underline-offset-2 transition-base duration-base ease-standard hover:text-accent-dim"
            >
              privacy@resernova.com
            </a>{" "}
            — {t.s6Reply}.
          </p>
        </Section>

        <Section eyebrow={t.s7Eyebrow} heading={t.s7Title}>
          <p>{t.s7Body}</p>
        </Section>

        <Section eyebrow={t.s8Eyebrow} heading={t.s8Title}>
          <p>{t.s8Body}</p>
        </Section>

        <Section eyebrow={t.s9Eyebrow} heading={t.s9Title}>
          <p>
            {t.s9Body}{" "}
            <a
              href="mailto:privacy@resernova.com"
              className="text-accent underline decoration-accent underline-offset-2 transition-base duration-base ease-standard hover:text-accent-dim"
            >
              privacy@resernova.com
            </a>
          </p>
        </Section>

        <p className="mt-16 border-t border-border pt-6 font-mono text-caption text-ink-muted">
          {t.lastUpdated}{" "}
          {new Date().toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </article>
    </main>
  );
}

function Section({
  eyebrow,
  heading,
  children,
}: {
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-h3 font-medium leading-snug text-ink md:text-h4">
        {heading}
      </h2>
      <div className="mt-4 text-body leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}

const labels = {
  fr: {
    eyebrow: "Conformité",
    heading: "Mentions légales & Confidentialité",
    consent: "consentement",
    s1Eyebrow: "01",
    s1Title: "Responsable du traitement",
    s1Body1:
      "Le responsable du traitement des données à caractère personnel collectées via cette page est",
    s1Body2: "Pour toute demande relative à vos données, contactez",
    s2Eyebrow: "02",
    s2Title: "Données collectées",
    s2Item1:
      "Nom complet et numéro de téléphone (obligatoires pour confirmer votre réservation)",
    s2Item2: "Adresse e-mail (optionnelle, pour recevoir la confirmation)",
    s2Item3:
      "Adresse IP (hachée SHA-256, conservée 24 h uniquement pour la sécurité anti-spam)",
    s2Item4: "User-agent et referrer du navigateur (audit technique)",
    s3Eyebrow: "03",
    s3Title: "Finalités",
    s3Body: "Les données sont utilisées exclusivement pour :",
    s3Item1: "Créer et gérer votre réservation",
    s3Item2:
      "Vous envoyer un rappel 24 h avant votre rendez-vous (si vous y avez consenti)",
    s3Item3: "Prévenir les abus (rate-limiting, anti-bot)",
    s4Eyebrow: "04",
    s4Title: "Base légale",
    s4Body1: "Le traitement est fondé sur votre",
    s4Body2:
      "(cases à cocher explicites) et sur l'exécution du contrat de réservation.",
    s5Eyebrow: "05",
    s5Title: "Durée de conservation",
    s5Item1:
      "Données de réservation : conservées tant que la relation contractuelle dure",
    s5Item2: "Adresse IP (hachée) : 24 heures, puis supprimée automatiquement",
    s5Item3: "Cookies : aucun cookie de tracking n'est déposé sur cette page",
    s6Eyebrow: "06",
    s6Title: "Vos droits (Loi 09-08)",
    s6Body:
      "Conformément à la loi marocaine 09-08, vous disposez d'un droit d'accès, de rectification, d'opposition et de suppression de vos données. Pour exercer ces droits, écrivez à",
    s6Reply: "nous traiterons votre demande dans un délai maximum de 30 jours",
    s7Eyebrow: "07",
    s7Title: "Sécurité",
    s7Body:
      "Toutes les communications sont chiffrées en TLS 1.3. Les jetons d'auto-gestion sont signés par HMAC-SHA256 et expirent après 7 jours. Aucun mot de passe n'est nécessaire pour gérer votre réservation.",
    s8Eyebrow: "08",
    s8Title: "Hébergement",
    s8Body:
      "Les données sont hébergées chez Supabase Inc. (infrastructure cloud sécurisée, certifications SOC 2 Type II et ISO 27001). Les serveurs sont localisés en Europe.",
    s9Eyebrow: "09",
    s9Title: "Contact",
    s9Body:
      "Pour toute question, réclamation ou demande d'exercice de vos droits :",
    lastUpdated: "Dernière mise à jour :",
  },
  en: {
    eyebrow: "Compliance",
    heading: "Legal & Privacy",
    consent: "consent",
    s1Eyebrow: "01",
    s1Title: "Data controller",
    s1Body1: "The data controller for personal data collected via this page is",
    s1Body2: "For any request related to your data, please contact",
    s2Eyebrow: "02",
    s2Title: "Data collected",
    s2Item1: "Full name and phone number (required to confirm your booking)",
    s2Item2: "Email address (optional, to receive the confirmation)",
    s2Item3:
      "IP address (SHA-256 hashed, kept 24 h only for anti-spam security)",
    s2Item4: "User-agent and referrer (technical audit)",
    s3Eyebrow: "03",
    s3Title: "Purposes",
    s3Body: "The data is used exclusively for:",
    s3Item1: "Creating and managing your booking",
    s3Item2:
      "Sending a reminder 24 h before your appointment (if you opted in)",
    s3Item3: "Abuse prevention (rate-limiting, anti-bot)",
    s4Eyebrow: "04",
    s4Title: "Legal basis",
    s4Body1: "Processing is based on your",
    s4Body2:
      "(explicit checkbox) and on the performance of the booking contract.",
    s5Eyebrow: "05",
    s5Title: "Retention periods",
    s5Item1:
      "Booking data: kept for the duration of the contractual relationship",
    s5Item2: "IP address (hashed): 24 hours, then automatically deleted",
    s5Item3: "Cookies: no tracking cookies are placed on this page",
    s6Eyebrow: "06",
    s6Title: "Your rights (Law 09-08)",
    s6Body:
      "Under Moroccan law 09-08, you have the right to access, rectify, oppose and delete your data. To exercise these rights, write to",
    s6Reply: "we will respond within a maximum of 30 days",
    s7Eyebrow: "07",
    s7Title: "Security",
    s7Body:
      "All communications are encrypted with TLS 1.3. Self-management tokens are signed with HMAC-SHA256 and expire after 7 days. No password is required to manage your booking.",
    s8Eyebrow: "08",
    s8Title: "Hosting",
    s8Body:
      "Data is hosted by Supabase Inc. (secure cloud infrastructure, SOC 2 Type II and ISO 27001 certified). Servers are located in Europe.",
    s9Eyebrow: "09",
    s9Title: "Contact",
    s9Body: "For any question, complaint or request to exercise your rights:",
    lastUpdated: "Last updated:",
  },
  ar: {
    eyebrow: "الامتثال",
    heading: "الشروط وسياسة الخصوصية",
    consent: "موافقة",
    s1Eyebrow: "٠١",
    s1Title: "مسؤول المعالجة",
    s1Body1: "مسؤول معالجة البيانات الشخصية التي يتم جمعها عبر هذه الصفحة هو",
    s1Body2: "لأي طلب يتعلق ببياناتكم، يرجى التواصل مع",
    s2Eyebrow: "٠٢",
    s2Title: "البيانات المجمعة",
    s2Item1: "الاسم الكامل ورقم الهاتف (مطلوب لتأكيد الحجز)",
    s2Item2: "البريد الإلكتروني (اختياري، لتلقي التأكيد)",
    s2Item3:
      "عنوان IP (مجزأ بـ SHA-256، يُحفظ ٢٤ ساعة فقط لأمان مكافحة البريد العشوائي)",
    s2Item4: "وكيل المستخدم والمرجع (تدقيق تقني)",
    s3Eyebrow: "٠٣",
    s3Title: "الأغراض",
    s3Body: "تُستخدم البيانات حصرياً لـ:",
    s3Item1: "إنشاء وإدارة حجزكم",
    s3Item2: "إرسال تذكير قبل ٢٤ ساعة من الموعد (إذا وافقتم)",
    s3Item3: "منع إساءة الاستخدام (تحديد المعدل، مكافحة البوتات)",
    s4Eyebrow: "٠٤",
    s4Title: "الأساس القانوني",
    s4Body1: "تستند المعالجة إلى",
    s4Body2: "الصريحة (مربع اختيار) وتنفيذ عقد الحجز.",
    s5Eyebrow: "٠٥",
    s5Title: "فترات الاحتفاظ",
    s5Item1: "بيانات الحجز: تُحفظ طوال مدة العلاقة التعاقدية",
    s5Item2: "عنوان IP (مجزأ): ٢٤ ساعة، ثم يُحذف تلقائياً",
    s5Item3: "ملفات تعريف الارتباط: لا يتم وضع أي ملف تتبع في هذه الصفحة",
    s6Eyebrow: "٠٦",
    s6Title: "حقوقكم (القانون ٠٩-٠٨)",
    s6Body:
      "وفقاً للقانون المغربي ٠٩-٠٨، لكم الحق في الوصول والتصحيح والاعتراض والحذف لبياناتكم. لممارسة هذه الحقوق، راسلونا على",
    s6Reply: "سنرد عليكم خلال مدة أقصاها ٣٠ يوماً",
    s7Eyebrow: "٠٧",
    s7Title: "الأمان",
    s7Body:
      "جميع الاتصالات مشفرة بـ TLS 1.3. الرموز المميزة للإدارة الذاتية موقعة بـ HMAC-SHA256 وتنتهي صلاحيتها بعد ٧ أيام. لا حاجة لكلمة مرور لإدارة حجزكم.",
    s8Eyebrow: "٠٨",
    s8Title: "الاستضافة",
    s8Body:
      "تستضيف Supabase Inc. البيانات (بنية تحتية سحابية آمنة، شهادات SOC 2 Type II و ISO 27001). الخوادم موجودة في أوروبا.",
    s9Eyebrow: "٠٩",
    s9Title: "الاتصال",
    s9Body: "لأي سؤال أو شكوى أو طلب لممارسة حقوقكم:",
    lastUpdated: "آخر تحديث:",
  },
} as const;
