/**
 * ConfirmStep — final review before submit.
 * Shows summary card + primary submit button (debounced via form.handleSubmit).
 */
"use client";

import { formatDate, formatSlot } from "@/lib/utils/time";
import type { UseFormReturn } from "react-hook-form";
import type { CreateBookingPayload } from "@/lib/validation/schemas";

type Staff = { id: string; name: string };

type Props = {
  form: UseFormReturn<CreateBookingPayload>;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  selectedSlot: { start: string; end: string } | null;
  selectedDate: string | null;
  staffList: Staff[];
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
  backLabel: string;
  confirmLabel: string;
  submittingLabel: string;
  locale: "fr" | "en" | "ar";
};

const labels = {
  fr: {
    summary: "Récapitulatif",
    service: "Prestation",
    date: "Date",
    time: "Heure",
    duration: "Durée",
    price: "Prix",
    total: "Total",
    whatsappConfirmed: "Rappel WhatsApp activé",
    noPreference: "Aucune préférence",
    back: "Retour",
  },
  en: {
    summary: "Summary",
    service: "Service",
    date: "Date",
    time: "Time",
    duration: "Duration",
    price: "Price",
    total: "Total",
    whatsappConfirmed: "WhatsApp reminder on",
    noPreference: "No preference",
    back: "Back",
  },
  ar: {
    summary: "الملخص",
    service: "الخدمة",
    date: "التاريخ",
    time: "الوقت",
    duration: "المدة",
    price: "السعر",
    total: "المجموع",
    whatsappConfirmed: "تذكير واتساب مفعل",
    noPreference: "دون تفضيل",
    back: "رجوع",
  },
};

export function ConfirmStep(props: Props) {
  const {
    form,
    serviceName,
    serviceDurationMinutes,
    servicePrice,
    selectedSlot,
    selectedDate,
    staffList,
    submitting,
    onBack,
    onSubmit,
    backLabel,
    confirmLabel,
    submittingLabel,
    locale,
  } = props;
  const t = labels[locale];
  const values = form.watch();

  const staffName =
    staffList.find((s) => s.id === values.requestedStaffId)?.name ??
    t.noPreference;
  const slotTime = selectedSlot
    ? formatSlot(
        selectedSlot.start,
        locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
      )
    : "";
  const slotDate = selectedDate
    ? formatDate(
        selectedDate + "T00:00:00",
        locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
      )
    : "";

  return (
    <div>
      <h3 className="font-display text-xl font-semibold">{t.summary}</h3>

      <dl className="mt-4 space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 text-sm">
        <Row label={t.service} value={serviceName} />
        <Row label={t.date} value={slotDate} />
        <Row label={t.time} value={slotTime} />
        <Row label={t.duration} value={`${serviceDurationMinutes} min`} />
        <Row label={t.price} value={formatMAD(servicePrice, locale)} />
        <Row
          label={
            staffList.length > 0
              ? locale === "fr"
                ? "Praticien"
                : locale === "en"
                  ? "Staff"
                  : "الممارس"
              : ""
          }
          value={staffName}
        />
        {values.whatsappOptIn && (
          <div className="flex items-center gap-2 pt-2 text-xs text-[var(--color-accent-600)]">
            <span className="grid size-2 place-items-center rounded-full bg-[var(--color-accent-500)]" />
            {t.whatsappConfirmed}
          </div>
        )}
        <hr className="border-[var(--color-border)]" />
        <Row label={t.total} value={formatMAD(servicePrice, locale)} bold />
      </dl>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 font-semibold text-[var(--color-text)] hover:bg-zinc-50 disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M13 5l-5 5 5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-500)] px-7 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {submitting && (
            <svg
              className="size-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                opacity="0.25"
              />
              <path
                d="M12 2a10 10 0 0110 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          )}
          {submitting ? submittingLabel : confirmLabel}
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  if (!label) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--color-text-muted)]">{label}</dt>
      <dd
        className={bold ? "font-display text-lg font-semibold" : "font-medium"}
      >
        {value}
      </dd>
    </div>
  );
}

function formatMAD(n: number, locale: "fr" | "en" | "ar"): string {
  try {
    return new Intl.NumberFormat(
      locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA",
      {
        style: "currency",
        currency: "MAD",
        maximumFractionDigits: 0,
      },
    ).format(n);
  } catch {
    return `${n} DH`;
  }
}
