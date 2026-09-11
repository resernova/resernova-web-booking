/**
 * Zod schemas — shared between Client Components (RHF zodResolver)
 * and Route Handlers. Strict mode rejects extra keys.
 */
import { z } from "zod";

// Morocco phone: +212XXXXXXXXX or 0XXXXXXXXX with [5-7]XXXXXXX
export const MoroccoPhone = z
  .string()
  .regex(/^(\+212|0)[5-7]\d{8}$/, "Numéro de téléphone marocain invalide");

// Public slug: kebab-case, 3-40 chars
export const PublicSlug = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, "Slug invalide");

export const Uuid = z.string().uuid();

export const IsoDateTime = z.string().datetime({ offset: true });
export const YmdDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date YYYY-MM-DD");

/* -------------------------------- Booking ------------------------------- */

export const CreateBookingPayload = z
  .object({
    serviceId: Uuid,
    slotStart: IsoDateTime,
    slotEnd: IsoDateTime,
    clientName: z.string().min(2, "Nom trop court").max(120, "Nom trop long"),
    clientPhone: MoroccoPhone,
    clientEmail: z.string().email().max(254).optional().or(z.literal("")),
    requestedStaffId: Uuid.optional().or(z.literal("")),
    serviceOptions: z.array(Uuid).max(8).optional(),
    specialRequest: z.string().max(500).optional().or(z.literal("")),
    whatsappOptIn: z.boolean().default(false),
    utm: z
      .object({
        source: z.string().max(80).optional(),
        medium: z.string().max(80).optional(),
        campaign: z.string().max(80).optional(),
        content: z.string().max(80).optional(),
      })
      .optional(),
    honeypot: z.string().max(0).optional(), // must be empty
  })
  .strict();

export const CreateBookingRequest = z
  .object({
    slug: PublicSlug,
    payload: CreateBookingPayload,
    idempotencyKey: Uuid,
  })
  .strict();

export type CreateBookingPayload = z.infer<typeof CreateBookingPayload>;
export type CreateBookingRequest = z.infer<typeof CreateBookingRequest>;

export const AvailabilityRequest = z
  .object({
    slug: PublicSlug,
    serviceId: Uuid,
    date: YmdDate,
    staffId: Uuid.optional(),
  })
  .strict();
export type AvailabilityRequest = z.infer<typeof AvailabilityRequest>;

export const CancelRequest = z
  .object({
    token: z.string().min(64).max(200),
    reason: z.string().max(500).optional(),
  })
  .strict();

export const RescheduleRequest = z
  .object({
    token: z.string().min(64).max(200),
    slotStart: IsoDateTime,
    slotEnd: IsoDateTime,
  })
  .strict();

/* --------------------------------- API --------------------------------- */

export const ApiOk = <T>(data: T) => ({ success: true as const, data });
export type ApiErrorCode =
  | "INVALID_INPUT"
  | "PROVIDER_NOT_FOUND"
  | "PROVIDER_DISABLED"
  | "SERVICE_NOT_FOUND"
  | "SLOT_IN_PAST"
  | "SLOT_TAKEN"
  | "SLOT_DURATION_MISMATCH"
  | "RATE_LIMITED"
  | "INVALID_TOKEN"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_ALREADY_FINALIZED"
  | "BOOKING_NOT_RESCHEDULABLE"
  | "INTERNAL";

export type ApiOkEnvelope<T> = { success: true; data: T };
export type ApiErrEnvelope = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
    suggestedSlots?: Array<{ slotStart: string; slotEnd: string }>;
  };
};
