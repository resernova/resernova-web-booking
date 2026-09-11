/**
 * BookingWizard — 4-step client component.
 * State machine: Service → Date/Time → Your details → Confirm.
 * URL hash tracks the current step for back-button friendliness.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CreateBookingPayload } from "@/lib/validation/schemas";
import { createBooking } from "@/server/actions/createBooking";
import { useRouter } from "next/navigation";

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

type Step = 1 | 2 | 3 | 4;

function generateIdempotencyKey(): string {
  // Crypto-grade UUID v4 from browser
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very old browsers)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const labels = {
  fr: {
    step1: "Service",
    step2: "Date & heure",
    step3: "Vos infos",
    step4: "Confirmation",
    next: "Continuer",
    back: "Retour",
    confirm: "Confirmer la réservation",
    submitting: "Confirmation en cours...",
    successToast: "Réservation confirmée !",
    networkError: "Erreur réseau. Veuillez réessayer.",
  },
  en: {
    step1: "Service", step2: "Date & time", step3: "Your details", step4: "Confirm",
    next: "Continue", back: "Back", confirm: "Confirm booking", submitting: "Confirming...",
    successToast: "Booking confirmed!", networkError: "Network error. Please try again.",
  },
  ar: {
    step1: "الخدمة", step2: "التاريخ والوقت", step3: "بياناتك", step4: "التأكيد",
    next: "متابعة", back: "رجوع", confirm: "تأكيد الحجز", submitting: "جاري التأكيد...",
    successToast: "تم تأكيد الحجز!", networkError: "خطأ في الشبكة. حاول مرة أخرى.",
  },
};

export function BookingWizard({
  slug, serviceId, serviceName, serviceDurationMinutes, servicePrice, staff, locale = "fr",
}: Props) {
  const router = useRouter();
  const t = labels[locale];
  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Init idempotency key from sessionStorage or create
  useEffect(() => {
    let key = sessionStorage.getItem("web-booking-idem");
    if (!key) {
      key = generateIdempotencyKey();
      sessionStorage.setItem("web-booking-idem", key);
    }
    setIdempotencyKey(key);
  }, []);

  // URL hash for back-button
  useEffect(() => {
    if (typeof window !== "undefined") {
      history.replaceState(null, "", `#step=${step}`);
    }
  }, [step]);

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

  const watchedStart = useMemo(() => selectedSlot?.start ?? null, [selectedSlot]);

  async function onSubmit(values: CreateBookingPayload) {
    if (!selectedSlot) {
      toast.error("Veuillez choisir un créneau");
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
          // strip empty strings to undefined for the Zod schema
          clientEmail: values.clientEmail || undefined,
          requestedStaffId: values.requestedStaffId || undefined,
          specialRequest: values.specialRequest || undefined,
        },
        idempotencyKey,
      });

      if (result.success) {
        toast.success(t.successToast);
        sessionStorage.removeItem("web-booking-idem");
        router.push(`/${slug}/book/confirm/${result.data.bookingId}#t=${result.data.manageToken}`);
      } else {
        const code = result.error.code;
        if (code === "SLOT_TAKEN") {
          toast.error(result.error.message);
          setStep(2); // back to date/time
          setSelectedSlot(null);
        } else if (code === "RATE_LIMITED") {
          toast.error("Trop de tentatives. Réessayez dans une minute.");
        } else if (code === "INVALID_INPUT") {
          toast.error("Informations invalides");
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

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-between gap-2" aria-label="Booking steps">
        {([1, 2, 3, 4] as const).map((s) => {
          const isCurrent = step === s;
          const isComplete = step > s;
          return (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${
                  isComplete ? "bg-[var(--color-accent-500)] text-white"
                  : isCurrent ? "bg-[var(--color-primary-500)] text-white"
                  : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {isComplete ? "✓" : s}
              </span>
              <span className={`hidden text-xs font-medium sm:inline ${isCurrent ? "text-[var(--color-primary-500)]" : "text-[var(--color-text-muted)]"}`}>
                {t[`step${s}` as keyof typeof t]}
              </span>
              {s < 4 && <span aria-hidden className="h-px flex-1 bg-zinc-200" />}
            </li>
          );
        })}
      </ol>

      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 shadow-card sm:p-8">
        {step === 1 && (
          <Step1ServiceSummary
            serviceName={serviceName}
            servicePrice={servicePrice}
            serviceDurationMinutes={serviceDurationMinutes}
            locale={locale}
            onNext={() => setStep(2)}
            nextLabel={t.next}
          />
        )}

        {step === 2 && (
          <Step2DateTime
            slug={slug}
            serviceId={serviceId}
            serviceDurationMinutes={serviceDurationMinutes}
            selectedDate={selectedDate}
            selectedSlot={selectedSlot}
            onDateChange={setSelectedDate}
            onSlotChange={setSelectedSlot}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            backLabel={t.back}
            nextLabel={t.next}
            locale={locale}
          />
        )}

        {step === 3 && (
          <Step3Details
            form={form}
            staff={staff}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
            backLabel={t.back}
            nextLabel={t.next}
            locale={locale}
          />
        )}

        {step === 4 && (
          <Step4Confirm
            form={form}
            serviceName={serviceName}
            serviceDurationMinutes={serviceDurationMinutes}
            servicePrice={servicePrice}
            selectedSlot={selectedSlot}
            selectedDate={selectedDate}
            submitting={submitting}
            staffList={staff}
            onBack={() => setStep(3)}
            onSubmit={form.handleSubmit(onSubmit)}
            backLabel={t.back}
            confirmLabel={t.confirm}
            submittingLabel={t.submitting}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */
/* STEP 1 — Service (just a confirmation; service is pre-selected by URL) */
/* ====================================================================== */

function Step1ServiceSummary({
  serviceName, servicePrice, serviceDurationMinutes, locale, onNext, nextLabel,
}: {
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
  locale: "fr" | "en" | "ar";
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">{serviceName}</h2>
      <p className="mt-2 text-[var(--color-text-muted)]">
        {serviceDurationMinutes} min · {formatMAD(servicePrice, locale)}
      </p>

      <div className="mt-6 rounded-2xl bg-[var(--color-primary-500)]/5 p-5">
        <p className="text-sm text-[var(--color-text-muted)]">
          {locale === "fr" && "Étape suivante : choisissez la date et l'heure de votre rendez-vous."}
          {locale === "en" && "Next step: choose the date and time of your appointment."}
          {locale === "ar" && "الخطوة التالية: اختر التاريخ والوقت لموعدك."}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-6 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {nextLabel}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* STEP 2 — Date & Time picker + SlotGrid                                */
/* ====================================================================== */

import { DateTimePicker } from "./DateTimePicker";
import { SlotGrid } from "./SlotGrid";

function Step2DateTime(props: {
  slug: string;
  serviceId: string;
  serviceDurationMinutes: number;
  selectedDate: string | null;
  selectedSlot: { start: string; end: string } | null;
  onDateChange: (d: string) => void;
  onSlotChange: (s: { start: string; end: string } | null) => void;
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
  locale: "fr" | "en" | "ar";
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">
        {props.locale === "fr" && "Date & heure"}
        {props.locale === "en" && "Date & time"}
        {props.locale === "ar" && "التاريخ والوقت"}
      </h2>

      <div className="mt-6">
        <DateTimePicker
          value={props.selectedDate}
          onChange={props.onDateChange}
          locale={props.locale}
        />
      </div>

      {props.selectedDate && (
        <div className="mt-6">
          <SlotGrid
            slug={props.slug}
            serviceId={props.serviceId}
            date={props.selectedDate}
            selectedSlot={props.selectedSlot}
            onSlotChange={props.onSlotChange}
            locale={props.locale}
          />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={props.onBack}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 font-semibold text-[var(--color-text)] hover:bg-zinc-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {props.backLabel}
        </button>
        <button
          type="button"
          onClick={props.onNext}
          disabled={!props.selectedSlot}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-6 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {props.nextLabel}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* STEP 3 — Your details (RHF + Zod)                                     */
/* ====================================================================== */

import { ClientDetailsForm } from "./ClientDetailsForm";

function Step3Details(props: {
  form: ReturnType<typeof useForm<CreateBookingPayload>>;
  staff: Staff[];
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
  locale: "fr" | "en" | "ar";
}) {
  const { form, onNext, onBack, staff, backLabel, nextLabel, locale } = props;

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">
        {locale === "fr" && "Vos informations"}
        {locale === "en" && "Your details"}
        {locale === "ar" && "بياناتك"}
      </h2>

      <ClientDetailsForm form={form} staff={staff} locale={locale} />

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-5 py-2.5 font-semibold text-[var(--color-text)] hover:bg-zinc-50"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M13 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {backLabel}
        </button>
        <button
          type="button"
          onClick={async () => {
            const ok = await form.trigger();
            if (ok) onNext();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-500)] px-6 py-3 font-semibold text-white shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {nextLabel}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/* STEP 4 — Confirm + submit                                             */
/* ====================================================================== */

import { ConfirmStep } from "./ConfirmStep";

function Step4Confirm(props: {
  form: ReturnType<typeof useForm<CreateBookingPayload>>;
  serviceName: string;
  serviceDurationMinutes: number;
  servicePrice: number;
  selectedSlot: { start: string; end: string } | null;
  selectedDate: string | null;
  submitting: boolean;
  staffList: Staff[];
  onBack: () => void;
  onSubmit: () => void;
  backLabel: string;
  confirmLabel: string;
  submittingLabel: string;
  locale: "fr" | "en" | "ar";
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">
        {props.locale === "fr" && "Récapitulatif"}
        {props.locale === "en" && "Summary"}
        {props.locale === "ar" && "الملخص"}
      </h2>
      <ConfirmStep
        form={props.form}
        serviceName={props.serviceName}
        serviceDurationMinutes={props.serviceDurationMinutes}
        servicePrice={props.servicePrice}
        selectedSlot={props.selectedSlot}
        selectedDate={props.selectedDate}
        staffList={props.staffList}
        submitting={props.submitting}
        onBack={props.onBack}
        onSubmit={props.onSubmit}
        backLabel={props.backLabel}
        confirmLabel={props.confirmLabel}
        submittingLabel={props.submittingLabel}
        locale={props.locale}
      />
    </div>
  );
}

function formatMAD(n: number, locale: "fr" | "en" | "ar"): string {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} DH`;
  }
}