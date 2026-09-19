/**
 * Badge — small inline label. Used for status pills, category tags, "Most Popular".
 */
import * as React from "react";

type Locale = "fr" | "en" | "ar";

const closeLabels = {
  fr: "Fermer",
  en: "Close",
  ar: "إغلاق",
} as const;

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "accent";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  removable?: boolean;
  onRemove?: () => void;
};

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface text-ink",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  tone = "neutral",
  removable = false,
  onRemove,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-sm border border-border/50 px-2 py-0.5 text-caption font-medium",
        toneClasses[tone],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
      {removable && (
        <button
          type="button"
          aria-label="Remove"
          onClick={onRemove}
          className="ml-1 rounded-sm p-0.5 hover:bg-ink/10"
        >
          ×
        </button>
      )}
    </span>
  );
}
