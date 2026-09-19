/**
 * BookingWizard — single-page split layout (Fresha-inspired), token-aligned.
 *
 * Replaces the old 4-step state machine. All sections visible at once on
 * desktop (sidebar with summary + main column with date/time + form).
 * Mobile collapses to stacked sections.
 *
 * Preserves the existing safeguards:
 *   - idempotency key (sessionStorage, cleared on success)
 *   - min-time-on-page gate (3s) — handled inside ClientDetailsForm
 *   - i18n labels (fr / en / ar)
 *
 * Reuses unchanged internal components:
 *   - DateTimePicker (now a day strip)
 *   - SlotGrid
 *   - ClientDetailsForm
 */
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreateBookingPayload } from "@/lib/validation/schemas";
import { createBooking } from "@/server/actions/createBooking";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DateTimePicker } from "./DateTimePicker";
import { SlotGrid } from "./SlotGrid";
import { ClientDetailsForm } from "./ClientDetailsForm";

type Staff = { id: string; name: string };

type Props = {
  slug: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  staff: Staff[];
  initialStaffId?: string;
  locale?: "fr" | "en" | "ar";
};

function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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

const labels = {
  fr: {
    summary: "Récapitulatif",
    dateTime: "Date & heure",
    details: "Vos informations",
    confirm: "Confirmer la réservation",
    submitting: "Confirmation en cours...",
    successToast: "Réservation confirmée !",
    networkError: "Erreur réseau. Veuillez réessayer.",
    totalLabel: "Total",
    durationLabel: (m: number) => `${m} min`,
    anyProfessional: "Tout professionnel",
    backToSalon: "Retour au salon",
    pickSlot: "Veuillez choisir un créneau",
    rateLimited: "Trop de tentatives. Réessayez dans une minute.",
    invalidInput: "Informations invalides",
  },
  en: {
    summary: "Summary",
    dateTime: "Date & time",
    details: "Your details",
    confirm: "Confirm booking",
    submitting: "Confirming...",
    successToast: "Booking confirmed!",
    networkError: "Network error. Please try again.",
    totalLabel: "Total",
    durationLabel: (m: number) => `${m} min`,
    anyProfessional: "Any professional",
    backToSalon: "Back to salon",
    pickSlot: "Please pick a slot",
    rateLimited: "Too many attempts. Try again in a minute.",
    invalidInput: "Invalid information",
  },
  ar: {
    summary: "الملخص",
    dateTime: "التاريخ والوقت",
    details: "بياناتك",
    confirm: "تأكيد الحجز",
    submitting: "جاري التأكيد...",
    successToast: "تم تأكيد الحجز!",
    networkError: "خطأ في الشبكة. حاول مرة أخرى.",
    totalLabel: "المجموع",
    durationLabel: (m: number) => `${m} دقيقة`,
    anyProfessional: "أي محترف",
    backToSalon: "العودة إلى الصالون",
    pickSlot: "الرجاء اختيار وقت",
    rateLimited: "محاولات كثيرة. حاول بعد دقيقة.",
    invalidInput: "بيانات غير صحيحة",
  },
};

export function BookingWizard({
  slug,
  serviceId,
  serviceName,
  serviceDurationMinutes,
  servicePrice,
  staff,
  initialStaffId,
  locale = "fr",
}: Props) {
  const t = labels[locale];
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialStaffId ?? "",
  );

  useEffect(() => {
    let key = sessionStorage.getItem("web-booking-idem");
    if (!key) {
      key = generateIdempotencyKey();
      sessionStorage.setItem("web-booking-idem", key);
    }
    setIdempotencyKey(key);
  }, []);

  const form = useForm<CreateBookingPayload>({
    resolver: zodResolver(CreateBookingPayload),
    mode: "onBlur",
    defaultValues: {
      serviceId,
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      specialRequest: "",
      requestedStaffId: "",
      whatsappOptIn: false,
    },
  });

  async function onSubmit(values: CreateBookingPayload) {
    if (!selectedSlot) {
      toast.error(t.pickSlot);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBooking({
        slug,
        payload: {
          ...values,
          serviceId,
          slotStart: selectedSlot.start,
          slotEnd: selectedSlot.end,
          clientEmail: values.clientEmail || undefined,
          requestedStaffId: selectedStaffId || values.requestedStaffId,
          specialRequest: values.specialRequest || undefined,
        },
        idempotencyKey,
      });

      if (result.success) {
        toast.success(t.successToast);
        sessionStorage.removeItem("web-booking-idem");
        router.push(
          `/${slug}/book/confirm/${result.data.bookingId}#t=${result.data.manageToken}`,
        );
      } else {
        const code = result.error.code;
        if (code === "SLOT_TAKEN") {
          toast.error(result.error.message);
          setSelectedSlot(null);
        } else if (code === "RATE_LIMITED") {
          toast.error(t.rateLimited);
        } else if (code === "INVALID_INPUT") {
          toast.error(t.invalidInput);
        } else {
          toast.error(t.networkError);
        }
      }
    } catch (e) {
      toast.error(t.networkError);
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!selectedSlot && form.formState.isValid && !submitting;

  // Sidebar summary (sticky on desktop)
  const Summary = (
    <aside className="lg:sticky lg:top-6">
      <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
        {t.summary}
      </p>
      <div className="mt-3 rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="size-12 shrink-0 rounded-md bg-accent-soft" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-body font-medium text-ink">
              {serviceName}
            </h3>
            <p className="font-mono text-caption text-ink-muted">
              ⏱ {t.durationLabel(serviceDurationMinutes)}
            </p>
          </div>
        </div>

        {staff.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <label
              htmlFor="staff-select"
              className="font-mono text-eyebrow uppercase tracking-wider text-ink-muted"
            >
              {t.anyProfessional}
            </label>
            <select
              id="staff-select"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="mt-2 w-full rounded-md border border-border bg-canvas px-3 py-2 text-body-sm font-medium text-ink transition-base duration-base ease-standard focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="">{t.anyProfessional}</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedSlot && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-body-sm">
              <span className="text-ink-muted">{t.totalLabel}</span>
              <span className="font-display text-h4 font-medium text-ink">
                {formatMAD(servicePrice, locale)}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  // Main column — three sections, all visible
  const Form = (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-lg border border-border bg-card p-5 shadow-sm sm:p-8"
    >
      <section>
        <h2 className="font-display text-h4 font-medium text-ink">
          {t.dateTime}
        </h2>
        <div className="mt-4">
          <DateTimePicker
            value={selectedDate}
            onChange={setSelectedDate}
            locale={locale}
          />
        </div>
        {selectedDate && (
          <div className="mt-4">
            <SlotGrid
              slug={slug}
              serviceId={serviceId}
              date={selectedDate}
              selectedSlot={selectedSlot}
              onSlotChange={setSelectedSlot}
              locale={locale}
            />
          </div>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <h2 className="font-display text-h4 font-medium text-ink">
          {t.details}
        </h2>
        <div className="mt-4">
          <ClientDetailsForm form={form} staff={staff} locale={locale} />
        </div>
      </section>

      <div className="border-t border-border pt-6">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={submitting}
          locale={locale}
        >
          {submitting ? t.submitting : t.confirm}
        </Button>
        <a
          href={`/${slug}`}
          className="mt-3 block text-center text-body-sm text-ink-muted transition-base duration-base ease-standard hover:text-ink"
        >
          {t.backToSalon}
        </a>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[35%_1fr]">
        {Summary}
        {Form}
      </div>
    </div>
  );
}
