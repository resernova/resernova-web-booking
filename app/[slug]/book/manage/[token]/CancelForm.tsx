/**
 * CancelForm — client form for canceling a booking via HMAC manage token.
 *
 * Calls the cancelBooking server action. On success:
 *   - Toast the success copy
 *   - Render the rotated manage link (token rotation: old link is invalid)
 *   - Provide a "copy link" affordance
 *
 * On error, render the error code as a Sonner toast and keep the form open.
 */
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cancelBooking } from "@/server/actions/cancelBooking";
import type { ManageLabels } from "@/lib/i18n/labels";

type Props = {
  manageToken: string;
  labels: ManageLabels;
  slug: string;
};

export function CancelForm({ manageToken, labels, slug }: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const newManageHref = newToken
    ? `${window.location.origin}/${slug}/book/manage/${newToken}`
    : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await cancelBooking({
        manageToken,
        reason: reason.trim() || undefined,
      });
      if (result.success) {
        toast.success(labels.cancelSuccess);
        setNewToken(result.data.newManageToken);
      } else {
        const code = result.error.code;
        if (code === "RATE_LIMITED") toast.error(labels.rateLimited);
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
          {labels.cancelHeading}
        </h3>
        <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
          {labels.cancelWarning}
        </p>
      </div>

      {!newToken ? (
        <form onSubmit={onSubmit} className="space-y-5">
          <Input
            multiline
            rows={3}
            maxLength={500}
            label={labels.cancelReasonLabel}
            placeholder={labels.cancelReasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Button
            type="submit"
            variant="danger"
            size="md"
            fullWidth
            disabled={submitting}
            loading={submitting}
          >
            {labels.cancelSubmit}
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
