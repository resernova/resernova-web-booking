/**
 * Modal — 16px radius. Centered on desktop, sheet on mobile.
 * Wraps native <dialog> for free focus-trap, escape-to-close, and a11y.
 * No Radix dependency — keeps the bundle slim.
 */
import * as React from "react";

type Locale = "fr" | "en" | "ar";

const closeLabels = {
  fr: "Fermer",
  en: "Close",
  ar: "إغلاق",
} as const;

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  locale?: Locale;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  locale = "fr",
  children,
  size = "md",
}: ModalProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="w-full max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-6 shadow-overlay backdrop:bg-ink/40 backdrop:backdrop-blur-sm sm:max-w-lg"
    >
      <div className={`w-full ${sizeClasses[size]}`}>
        {(title || description) && (
          <header className="mb-4">
            {title && (
              <h2 className="font-display text-h2 font-medium text-ink">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
            )}
          </header>
        )}
        <div>{children}</div>
        <form method="dialog" className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-md border border-border bg-canvas px-4 py-2 text-caption font-medium text-ink hover:bg-surface"
          >
            {closeLabels[locale]}
          </button>
        </form>
      </div>
    </dialog>
  );
}
