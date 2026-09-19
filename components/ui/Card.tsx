/**
 * Card — 12px radius (Notion default, NOT Fresha pill).
 * Variants: base (white + hairline), media (16:9 image + content), elevated (shadow-md).
 */
import * as React from "react";

type Variant = "base" | "media" | "elevated";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  as?: "div" | "article" | "section";
};

const variantClasses: Record<Variant, string> = {
  base: "bg-card border border-border rounded-md shadow-sm",
  media: "bg-card border border-border rounded-md overflow-hidden shadow-sm",
  elevated: "bg-card border border-border rounded-md shadow-md",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "base", className, children, as: Tag = "div", ...props },
    ref,
  ) => {
    return React.createElement(
      Tag,
      {
        ref,
        className: [variantClasses[variant], className ?? ""]
          .filter(Boolean)
          .join(" "),
        ...props,
      },
      children,
    );
  },
);
Card.displayName = "Card";
