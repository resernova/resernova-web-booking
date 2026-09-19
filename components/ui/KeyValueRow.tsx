/**
 * KeyValueRow — single row in a `<dl>` description list.
 *
 * Used by confirmation + manage pages to render booking summary.
 * Replaces two copy-pasted `Row({ label, value })` components.
 */
import * as React from "react";

type Props = {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Whether to render the value in a monospace font (e.g. for IDs/refs). */
  mono?: boolean;
};

export function KeyValueRow({ label, value, mono = false }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 py-3 last:border-b-0">
      <dt className="text-caption uppercase tracking-wider text-ink-muted">
        {label}
      </dt>
      <dd
        className={[
          "text-right text-body font-medium text-ink",
          mono ? "font-mono" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
