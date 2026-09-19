/**
 * SectionHeader — eyebrow + heading + optional sub + optional action.
 *
 * Replaces 13+ inline copies of:
 *   <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
 *     {eyebrow}
 *   </p>
 *   <h2 className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
 *     {heading}
 *   </h2>
 */
import * as React from "react";

type Props = {
  eyebrow?: string;
  heading: string;
  /** Optional sub-line beneath the heading. */
  sub?: React.ReactNode;
  /** Optional action (e.g. a link/button) on the right. */
  action?: React.ReactNode;
  /** Center the header instead of left-aligning. */
  centered?: boolean;
  /** Heading level — h2 by default. Use h1 for the page top-level. */
  as?: "h1" | "h2" | "h3";
};

export function SectionHeader({
  eyebrow,
  heading,
  sub,
  action,
  centered = false,
  as: HeadingTag = "h2",
}: Props) {
  return (
    <header
      className={[
        "mb-10 flex items-baseline justify-between gap-6",
        centered ? "flex-col items-center text-center" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={centered ? "" : "max-w-2xl"}>
        {eyebrow && (
          <p className="font-mono text-eyebrow uppercase tracking-wider text-accent">
            {eyebrow}
          </p>
        )}
        <HeadingTag className="mt-3 font-display text-h2 font-medium leading-tight text-ink md:text-h1">
          {heading}
        </HeadingTag>
        {sub && (
          <p className="mt-4 max-w-2xl text-body-lg leading-relaxed text-ink-muted">
            {sub}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
