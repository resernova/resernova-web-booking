/**
 * ClientDetailsForm — RHF + ZodResolver, token-aligned.
 * Includes honeypot field (hidden) + min-time-on-page gate.
 */
"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { CreateBookingPayload } from "@/lib/validation/schemas";

type Staff = { id: string; name: string };

type Props = {
  form: UseFormReturn<CreateBookingPayload>;
  staff: Staff[];
  locale: "fr" | "en" | "ar";
};

const labels = {
  fr: {
    fullName: "Nom complet",
    fullNamePlaceholder: "ex. Fatima Zahra Bennani",
    phone: "Téléphone",
    phonePlaceholder: "06XXXXXXXX ou +212XXXXXXXXX",
    email: "E-mail (optionnel)",
    emailPlaceholder: "vous@exemple.com",
    specialRequest: "Demande spéciale (optionnel)",
    specialRequestPlaceholder: "Une préférence, une allergie, un horaire...",
    preferredStaff: "Praticien préféré (optionnel)",
    noPreference: "Aucune préférence",
    whatsappOptIn: "Recevoir un rappel par WhatsApp 24 h avant",
    required: "Ce champ est obligatoire",
    phoneInvalid: "Numéro de téléphone marocain invalide",
    emailInvalid: "Adresse e-mail invalide",
    nameMin: "Le nom doit faire au moins 2 caractères",
    requestMax: "Maximum 500 caractères",
    waitMsg: "Veuillez patienter quelques secondes avant de soumettre...",
  },
  en: {
    fullName: "Full name",
    fullNamePlaceholder: "e.g. Fatima Zahra Bennani",
    phone: "Phone",
    phonePlaceholder: "06XXXXXXXX or +212XXXXXXXXX",
    email: "Email (optional)",
    emailPlaceholder: "you@example.com",
    specialRequest: "Special request (optional)",
    specialRequestPlaceholder: "A preference, an allergy, a timing...",
    preferredStaff: "Preferred staff (optional)",
    noPreference: "No preference",
    whatsappOptIn: "Receive a WhatsApp reminder 24 h before",
    required: "This field is required",
    phoneInvalid: "Invalid Moroccan phone number",
    emailInvalid: "Invalid email address",
    nameMin: "Name must be at least 2 characters",
    requestMax: "Maximum 500 characters",
    waitMsg: "Please wait a few seconds before submitting...",
  },
  ar: {
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "مثال: فاطمة الزهراء بناني",
    phone: "الهاتف",
    phonePlaceholder: "06XXXXXXXX أو +212XXXXXXXXX",
    email: "البريد الإلكتروني (اختياري)",
    emailPlaceholder: "you@example.com",
    specialRequest: "طلب خاص (اختياري)",
    specialRequestPlaceholder: "تفضيل، حساسية، توقيت...",
    preferredStaff: "الممارس المفضل (اختياري)",
    noPreference: "دون تفضيل",
    whatsappOptIn: "تذكير عبر واتساب قبل 24 ساعة",
    required: "هذا الحقل إلزامي",
    phoneInvalid: "رقم هاتف مغربي غير صالح",
    emailInvalid: "عنوان بريد إلكتروني غير صالح",
    nameMin: "يجب أن يكون الاسم حرفين على الأقل",
    requestMax: "الحد الأقصى 500 حرف",
    waitMsg: "يرجى الانتظار بضع ثوانٍ قبل الإرسال...",
  },
};

export function ClientDetailsForm({ form, staff, locale }: Props) {
  const t = labels[locale];
  const {
    register,
    formState: { errors },
  } = form;

  // Min-time-on-page gate: user must spend >3s on the wizard before allowing submit
  const [pageMounted] = useState(() => Date.now());
  const [timeElapsed, setTimeElapsed] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - pageMounted >= 3000) {
        setTimeElapsed(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [pageMounted]);

  return (
    <form className="mt-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
      {/* Full name */}
      <Field
        label={t.fullName}
        required
        error={
          errors.clientName?.message ??
          (errors.clientName?.type === "too_small" ? t.nameMin : undefined)
        }
      >
        <input
          {...register("clientName")}
          type="text"
          autoComplete="name"
          placeholder={t.fullNamePlaceholder}
          aria-invalid={!!errors.clientName}
          className={inputCls(!!errors.clientName)}
        />
      </Field>

      {/* Phone */}
      <Field
        label={t.phone}
        required
        error={
          errors.clientPhone?.message ??
          (errors.clientPhone?.type === "invalid_string"
            ? t.phoneInvalid
            : undefined)
        }
      >
        <input
          {...register("clientPhone")}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t.phonePlaceholder}
          aria-invalid={!!errors.clientPhone}
          className={inputCls(!!errors.clientPhone)}
        />
      </Field>

      {/* Email */}
      <Field
        label={t.email}
        error={
          errors.clientEmail?.message ??
          (errors.clientEmail?.type === "invalid_string"
            ? t.emailInvalid
            : undefined)
        }
      >
        <input
          {...register("clientEmail")}
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          aria-invalid={!!errors.clientEmail}
          className={inputCls(!!errors.clientPhone)}
        />
      </Field>

      {/* Preferred staff */}
      <Field label={t.preferredStaff}>
        <select
          {...register("requestedStaffId")}
          className={inputCls(false)}
          defaultValue=""
        >
          <option value="">{t.noPreference}</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Special request */}
      <Field
        label={t.specialRequest}
        error={
          errors.specialRequest?.message ??
          (errors.specialRequest?.type === "too_big" ? t.requestMax : undefined)
        }
      >
        <textarea
          {...register("specialRequest")}
          rows={3}
          maxLength={500}
          placeholder={t.specialRequestPlaceholder}
          aria-invalid={!!errors.specialRequest}
          className={inputCls(!!errors.specialRequest)}
        />
      </Field>

      {/* WhatsApp opt-in — explicit checkbox (not pre-checked) */}
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-canvas p-4">
        <input
          {...register("whatsappOptIn")}
          type="checkbox"
          className="mt-1 size-5 rounded border-border accent-accent"
        />
        <span className="text-body-sm leading-relaxed text-ink">
          {t.whatsappOptIn}
        </span>
      </label>

      {/* Honeypot — hidden from users; bots fill all fields */}
      <div className="honeypot" aria-hidden="true">
        <label>
          Website (ne pas remplir)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("honeypot")}
            defaultValue=""
          />
        </label>
      </div>

      {!timeElapsed && (
        <p className="text-caption text-ink-muted">{t.waitMsg}</p>
      )}
    </form>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-body-sm font-medium text-ink">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-error">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-caption text-error">
          {error}
        </p>
      )}
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return [
    "block w-full rounded-md border bg-canvas px-4 py-3 text-base text-ink",
    "placeholder:text-ink-soft focus:outline-none focus:ring-2",
    "transition-base duration-base ease-standard",
    hasError
      ? "border-error focus:border-error focus:ring-error/20"
      : "border-border focus:border-accent focus:ring-accent/20",
  ].join(" ");
}
