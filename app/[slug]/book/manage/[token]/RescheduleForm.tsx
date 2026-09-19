/**
 * RescheduleForm — client form for changing a booking's time slot.
 *
 * Reuses the existing DateTimePicker + SlotGrid primitives. On submit:
 *   - Calls rescheduleBooking server action with HMAC token + new slot
 *   - Renders the rotated manage link on success (token rotation)
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { SlotGrid } from "@/components/booking/SlotGrid";
import { Button } from "@/components/ui/Button";
import { rescheduleBooking } from "@/server/actions/rescheduleBooking";
import type { Locale } from "@/lib/i18n/config";
import type { ManageLabels } from "@/lib/i18n/labels";

type Props = {
  manageToken: string;
  serviceId: string;
  serviceDurationMinutes: number;
  labels: ManageLabels;
  slug: string;
  locale: Locale;
  initialDate: string | null;
};

export function RescheduleForm({
  manageToken,
  serviceId,
  labels,
  slug,
  locale,
  initialDate,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const newManageHref = newToken
    ? `${window.location.origin}/${slug}/book/manage/${newToken}`
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const result = await rescheduleBooking({
        manageToken,
        newSlotStart: selectedSlot.start,
        newSlotEnd: selectedSlot.end,
      });
      if (result.success) {
        toast.success(labels.rescheduleSuccess);
        setNewToken(result.data.newManageToken);
      } else {
        const code = result.error.code;
        if (code === "SLOT_TAKEN") {
          toast.error(labels.slotTaken);
          setSelectedSlot(null);
        } else if (code === "RATE_LIMITED") toast.error(labels.rateLimited);
        else if (code === "INVALID_INPUT") toast.error(labels.invalidInput);
        else toast.error(labels.networkError);
      }
    } catch {
      toast.error(labels.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!newManageHref) return;
    try {
      await navigator.clipboard.writeText(newManageHref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(labels.networkError);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-h4 font-medium text-ink">
          {labels.rescheduleHeading}
        </h3>
        <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
          {labels.rescheduleHint}
        </p>
      </div>

      {!newToken ? (
        <form onSubmit={onSubmit} className="space-y-5">
          <DateTimePicker
            value={selectedDate}
            onChange={setSelectedDate}
            locale={locale}
          />
          {selectedDate && (
            <SlotGrid
              slug={slug}
              serviceId={serviceId}
              date={selectedDate}
              selectedSlot={selectedSlot}
              onSlotChange={setSelectedSlot}
              locale={locale}
            />
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={!selectedSlot || submitting}
            loading={submitting}
            locale={locale}
          >
            {submitting ? labels.submitting : labels.rescheduleSubmit}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg border border-border bg-accent-soft p-6">
          <p className="text-body-sm leading-relaxed text-ink">
            {labels.newTokenNotice}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <code className="flex-1 truncate rounded-md border border-border bg-canvas px-3 py-2 font-mono text-caption text-ink">
              {newManageHref}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-md border border-border bg-canvas px-3 py-2 text-body-sm font-medium text-ink transition-base duration-base ease-standard hover:bg-surface"
            >
              {copied ? labels.linkCopied : labels.copyLink}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
