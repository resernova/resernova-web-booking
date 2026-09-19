/**
 * Container — single source of truth for content width + side gutters.
 *
 * Replaces 6+ inline `mx-auto max-w-{2xl,3xl,5xl,6xl,7xl} px-4 sm:px-6`
 * patterns across the codebase.
 *
 * Sizes:
 *   - sm    → max-w-2xl → Confirmation, error, loading, 404
 *   - md    → max-w-3xl → Manage page, services catalog, legal
 *   - lg    → max-w-5xl → Salon profile, single-column content
 *   - xl    → max-w-6xl → Landing sections (Benefits, HowItWorks)
 *   - hero  → max-w-7xl → Full-bleed marketing surface
 */
import * as React from "react";

type Size = "sm" | "md" | "lg" | "xl" | "hero";

const sizeClasses: Record<Size, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
  hero: "max-w-7xl",
};

export type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: Size;
  /** When true, adds vertical padding for top-level page surfaces. */
  bleed?: boolean;
};

export function Container({
  size = "xl",
  bleed = false,
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={[
        "mx-auto px-4 sm:px-6",
        sizeClasses[size],
        bleed ? "py-12 sm:py-16 md:py-20" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
