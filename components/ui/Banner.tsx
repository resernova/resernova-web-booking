/**
 * Banner — accent-soft callout card. Used for success states
 * (post-booking reference, post-reschedule / post-cancel confirmation).
 *
 * Replaces 3 hand-rolled `rounded-lg border border-border bg-accent-soft p-6`
 * copies across confirm/manage flows.
 */
import * as React from "react";

type Tone = "success" | "info" | "warning" | "error" | "accent";

const toneClasses: Record<Tone, string> = {
  success: "bg-success/10 border-success/30",
  info: "bg-info/10 border-info/30",
  warning: "bg-warning/10 border-warning/30",
  error: "bg-error/10 border-error/30",
  accent: "bg-accent-soft border-accent/30",
};

type Props = React.HTMLAttributes<HTMLDivElement> & {
  tone?: Tone;
};

export function Banner({
  tone = "accent",
  className,
  children,
  ...props
}: Props) {
  return (
    <div
      className={["rounded-lg border p-6", toneClasses[tone], className ?? ""]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
