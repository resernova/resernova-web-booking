/**
 * Icon — thin wrapper around lucide-react. Ensures consistent sizing and
 * stroke width. Use this instead of importing from lucide-react directly.
 */
import * as React from "react";
import type { LucideIcon } from "lucide-react";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

type IconProps = {
  icon: LucideIcon;
  size?: Size;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
};

const sizeClasses: Record<Size, string> = {
  xs: "size-3",
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
  xl: "size-8",
};

export function Icon({
  icon: IconComponent,
  size = "md",
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}: IconProps) {
  return (
    <IconComponent
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      strokeWidth={1.75}
      className={[sizeClasses[size], className ?? ""].filter(Boolean).join(" ")}
    />
  );
}
