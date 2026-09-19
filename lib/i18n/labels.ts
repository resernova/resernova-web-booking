/**
 * Shared i18n labels for booking lifecycle pages.
 *
 * Used by:
 *  - app/[slug]/book/confirm/[bookingRef]/page.tsx
 *  - app/[slug]/book/manage/[token]/page.tsx
 *  - app/[slug]/book/manage/[token]/CancelForm.tsx
 *  - app/[slug]/book/manage/[token]/RescheduleForm.tsx
 *
 * Per-component `labels` objects still exist for component-specific copy
 * (e.g. wizard labels, time-slot text). This module centralises the
 * lifecycle-page copy so we don't duplicate across 5+ components.
 */
import type { Locale } from "./config";

export const manageLabels = {
  fr: {
    eyebrow: "Gérer la réservation",
    heading: "Votre réservation",
    referenceLabel: "Référence",
    currentBookingHeading: "Détails actuels",
    service: "Prestation",
    dateTime: "Date & heure",
    duration: "Durée",
    place: "Lieu",
    status: "Statut",
    statusConfirmed: "Confirmé",
    statusPending: "En attente de confirmation",
    statusCanceled: "Annulé",
    statusCompleted: "Terminé",
    tabs: {
      reschedule: "Modifier le créneau",
      cancel: "Annuler la réservation",
    },
    invalidTokenLabel: "Lien invalide",
    invalidTokenHeading: "Lien invalide ou expiré",
    invalidTokenBody:
      "Ce lien de gestion n'est plus valide. Si vous souhaitez modifier ou annuler votre réservation, contactez directement le salon.",
    rescheduleHeading: "Choisissez un nouveau créneau",
    rescheduleHint: "Sélectionnez une nouvelle date et heure.",
    rescheduleSubmit: "Confirmer le nouveau créneau",
    rescheduleSuccess: "Créneau mis à jour.",
    cancelHeading: "Annuler cette réservation",
    cancelWarning:
      "Cette action est irréversible. Le salon sera informé de votre annulation.",
    cancelReasonLabel: "Motif (optionnel)",
    cancelReasonPlaceholder: "Une raison, un empêchement...",
    cancelSubmit: "Annuler la réservation",
    cancelSuccess: "Réservation annulée.",
    newTokenNotice:
      "Votre ancien lien a été désactivé. Voici votre nouveau lien de gestion :",
    submitting: "En cours...",
    legalLink: "Mentions légales & confidentialité",
    copyLink: "Copier le lien",
    linkCopied: "Lien copié ✓",
    backToSalon: "Retour au salon",
    networkError: "Erreur réseau. Veuillez réessayer.",
    rateLimited: "Trop de tentatives. Réessayez dans une minute.",
    invalidInput: "Informations invalides.",
    slotTaken: "Ce créneau vient d'être réservé. Choisissez-en un autre.",
    browserBack: "Retour à l'accueil",
  },
  en: {
    eyebrow: "Manage booking",
    heading: "Your booking",
    referenceLabel: "Reference",
    currentBookingHeading: "Current details",
    service: "Service",
    dateTime: "Date & time",
    duration: "Duration",
    place: "Location",
    status: "Status",
    statusConfirmed: "Confirmed",
    statusPending: "Awaiting confirmation",
    statusCanceled: "Canceled",
    statusCompleted: "Completed",
    tabs: {
      reschedule: "Reschedule",
      cancel: "Cancel booking",
    },
    invalidTokenLabel: "Invalid link",
    invalidTokenHeading: "Invalid or expired link",
    invalidTokenBody:
      "This management link is no longer valid. To modify or cancel your booking, contact the salon directly.",
    rescheduleHeading: "Pick a new time",
    rescheduleHint: "Select a new date and time.",
    rescheduleSubmit: "Confirm new time",
    rescheduleSuccess: "Booking rescheduled.",
    cancelHeading: "Cancel this booking",
    cancelWarning:
      "This action cannot be undone. The salon will be notified of your cancellation.",
    cancelReasonLabel: "Reason (optional)",
    cancelReasonPlaceholder: "A reason, an inconvenience...",
    cancelSubmit: "Cancel booking",
    cancelSuccess: "Booking canceled.",
    newTokenNotice:
      "Your previous link has been disabled. Here is your new management link:",
    submitting: "Loading...",
    legalLink: "Legal & privacy",
    copyLink: "Copy link",
    linkCopied: "Link copied ✓",
    backToSalon: "Back to salon",
    networkError: "Network error. Please try again.",
    rateLimited: "Too many attempts. Try again in a minute.",
    invalidInput: "Invalid information.",
    slotTaken: "That slot was just taken. Please pick another.",
    browserBack: "Back to home",
  },
  ar: {
    eyebrow: "إدارة الحجز",
    heading: "حجزكم",
    referenceLabel: "المرجع",
    currentBookingHeading: "التفاصيل الحالية",
    service: "الخدمة",
    dateTime: "التاريخ والوقت",
    duration: "المدة",
    place: "المكان",
    status: "الحالة",
    statusConfirmed: "مؤكد",
    statusPending: "في انتظار التأكيد",
    statusCanceled: "ملغى",
    statusCompleted: "مكتمل",
    tabs: {
      reschedule: "تعديل الموعد",
      cancel: "إلغاء الحجز",
    },
    invalidTokenLabel: "رابط غير صالح",
    invalidTokenHeading: "رابط غير صالح أو منتهي الصلاحية",
    invalidTokenBody:
      "لم يعد رابط الإدارة هذا صالحًا. لتعديل أو إلغاء حجزكم، يرجى التواصل مع الصالون مباشرة.",
    rescheduleHeading: "اختر موعدًا جديدًا",
    rescheduleHint: "اختر تاريخًا ووقتًا جديدًا.",
    rescheduleSubmit: "تأكيد الموعد الجديد",
    rescheduleSuccess: "تم تحديث الموعد.",
    cancelHeading: "إلغاء هذا الحجز",
    cancelWarning:
      "هذا الإجراء لا يمكن التراجع عنه. سيتم إبلاغ الصالون بإلغاءكم.",
    cancelReasonLabel: "السبب (اختياري)",
    cancelReasonPlaceholder: "سبب، مانع...",
    cancelSubmit: "إلغاء الحجز",
    cancelSuccess: "تم إلغاء الحجز.",
    newTokenNotice: "تم تعطيل الرابط السابق. إليكم رابط الإدارة الجديد:",
    submitting: "جارٍ التحميل...",
    legalLink: "الشروط وسياسة الخصوصية",
    copyLink: "نسخ الرابط",
    linkCopied: "✓ تم النسخ",
    backToSalon: "العودة إلى الصالون",
    networkError: "خطأ في الشبكة. حاول مرة أخرى.",
    rateLimited: "محاولات كثيرة. حاول بعد دقيقة.",
    invalidInput: "بيانات غير صحيحة.",
    slotTaken: "تم حجز هذا الموعد للتو. اختر موعدًا آخر.",
    browserBack: "العودة إلى الصفحة الرئيسية",
  },
} as const;

export type ManageLabels = (typeof manageLabels)[Locale];
