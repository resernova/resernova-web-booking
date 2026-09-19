/**
 * Button — Linear / Stripe pattern. Sharp corners (8-12px radius, NEVER pills).
 * Variants: primary (filled accent), secondary (hairline border), ghost (text only).
 * Locales: fr, en, ar with built-in labels for loading.
 */
import * as React from "react";

type Locale = "fr" | "en" | "ar";

const labels = {
  fr: { loading: "Chargement..." },
  en: { loading: "Loading..." },
  ar: { loading: "...جارٍ التحميل" },
} as const;

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonOwnProps = {
  variant?: Variant;
  size?: Size;
  locale?: Locale;
  loading?: boolean;
  fullWidth?: boolean;
};

type ButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps>;

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-ink-inverse shadow-button hover:bg-accent-dim hover:-translate-y-px hover:shadow-md",
  secondary:
    "bg-canvas text-ink border border-border hover:bg-surface hover:border-ink-muted",
  ghost: "bg-transparent text-ink hover:bg-surface",
  success:
    "bg-success text-ink-inverse shadow-button hover:bg-success/90 hover:-translate-y-px hover:shadow-md",
  danger:
    "bg-error text-ink-inverse shadow-button hover:bg-error/90 hover:-translate-y-px hover:shadow-md",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-caption",
  md: "px-6 py-3 text-base",
  lg: "px-7 py-4 text-body-lg",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      locale = "fr",
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const t = labels[locale];
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-md font-medium",
          "transition-base duration-base ease-standard",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="size-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
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
            <span>{t.loading}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";
