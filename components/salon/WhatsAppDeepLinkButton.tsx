/**
 * WhatsAppDeepLinkButton — wa.me deep link to the salon's WhatsApp number.
 * Hidden when no whatsapp_display_phone is set.
 * Token-aligned with the Linear-style editorial language.
 */
type Props = {
  phone: string | null | undefined;
  businessName: string;
  /** Optional pre-filled message */
  message?: string;
  locale?: "fr" | "en" | "ar";
};

const labels = {
  fr: "Nous écrire sur WhatsApp",
  en: "Message us on WhatsApp",
  ar: "راسلنا على واتساب",
} as const;

export function WhatsAppDeepLinkButton({
  phone,
  businessName,
  message,
  locale = "fr",
}: Props) {
  if (!phone) return null;

  // Normalize: strip + and spaces for wa.me
  const normalized = phone.replace(/[^\d+]/g, "");
  const defaultMsg =
    message ??
    (locale === "ar"
      ? `مرحبا، أريد الاستفسار عن حجز موعد في ${businessName}`
      : locale === "en"
        ? `Hi, I'd like to inquire about booking at ${businessName}`
        : `Bonjour, je souhaite réserver chez ${businessName}`);
  const url = `https://wa.me/${normalized.replace(/^\+/, "")}?text=${encodeURIComponent(defaultMsg)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-success px-5 py-2.5 text-body-sm font-medium text-ink-inverse shadow-button transition-base duration-base ease-standard hover:-translate-y-px"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9s-.5-.1-.7.1-.8.9-.9 1.1c-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5s-.7-1.6-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 1.7.7 2.4.8 3.3.6.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.5-.3zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.4 1.3 4.9L2 22l5.3-1.4c1.4.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3c-.9-1.4-1.4-3-1.4-4.6 0-4.5 3.6-8.2 8.2-8.2s8.2 3.6 8.2 8.2c.1 4.5-3.6 8.2-8 8.2z" />
      </svg>
      {labels[locale]}
    </a>
  );
}
