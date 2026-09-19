/**
 * Input — 8px radius (Notion default). Hairline border, focus = accent + ring.
 * Supports text, email, tel, textarea via `multiline` prop.
 */
import * as React from "react";

type Locale = "fr" | "en" | "ar";

const placeholders = {
  fr: { name: "ex. Fatima Zahra Bennani", phone: "06XXXXXXXX ou +212XXXXXXXXX", email: "vous@exemple.com" },
  en: { name: "e.g. John Smith", phone: "+1 555 123 4567", email: "you@example.com" },
  ar: { name: "مثال: فاطمة الزهراء بناني", phone: "06XXXXXXXX أو +212XXXXXXXXX", email: "you@example.com" },
} as const;

type InputBaseProps = {
  locale?: Locale;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

type InputProps = InputBaseProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof InputBaseProps> & {
    multiline?: false;
  };

type TextareaProps = InputBaseProps & {
  multiline: true;
  rows?: number;
} & Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    keyof InputBaseProps | "multiline" | "rows"
  >;

export const Input = forwardRef<
  HTMLInputElement,
  InputProps | TextareaProps
>(
  (props, ref) => {
    const {
      locale = "fr",
      label,
      hint,
      error,
      required,
      className,
      id,
      ...rest
    } = props;
    const ph = placeholders[locale];

    const auto = label
      ? `input-${label.replace(/\W+/g, "-").toLowerCase()}-${id ?? ""}`
      : id;

    const baseFieldClasses = [
      "block w-full rounded-md border bg-canvas px-3 py-2 text-base",
      "placeholder:text-ink-soft",
      "focus:outline-none focus:ring-2 focus:ring-accent/20",
      "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface",
      error
        ? "border-error focus:border-error focus:ring-error/20"
        : "border-border focus:border-accent",
    ].join(" ");

    const labelEl = label ? (
      <label htmlFor={auto} className="mb-1 block text-sm font-medium text-ink">
        {label}
        {required && <span aria-hidden className="ml-0.5 text-error">*</span>}
      </label>
    ) : null;

    const hintEl =
      hint && !error ? (
        <p className="mt-1 text-caption text-ink-muted">{hint}</p>
      ) : null;

    const errorEl = error ? (
      <p role="alert" className="mt-1 text-caption text-error">
        {error}
      </p>
    ) : null;

    const placeholder =
      (rest.placeholder as string | undefined) ??
      (rest.type === "email"
        ? ph.email
        : rest.type === "tel"
          ? ph.phone
          : ph.name);

    if (props.multiline) {
      const { rows = 4, ...restTa } = rest as TextareaProps;
      return (
        <div className={className}>
          {labelEl}
          <textarea
            id={auto}
            rows={rows}
            placeholder={placeholder}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${auto}-error` : hint ? `${auto}-hint` : undefined
            }
            required={required}
            className={baseFieldClasses}
            {...restTa}
          />
          {errorEl}
          {hintEl}
        </div>
      );
    }

    return (
      <div className={className}>
        {labelEl}
        <input
          ref={ref}
          id={auto}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${auto}-error` : hint ? `${auto}-hint` : undefined
          }
          required={required}
          className={baseFieldClasses}
          {...(rest as InputProps)}
        />
        {errorEl}
        {hintEl}
      </div>
    );
  },
);
Input.displayName = "Input";
