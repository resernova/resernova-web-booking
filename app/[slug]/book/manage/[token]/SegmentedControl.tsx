/**
 * SegmentedControl — 2-tab pill UI primitive (Linear-style).
 *
 * Used by the manage page to switch between "reschedule" and "cancel" modes.
 */
"use client";

import { useState, type ReactNode } from "react";

export type SegmentedTab<T extends string> = {
  id: T;
  label: string;
  render: () => ReactNode;
};

type Props<T extends string> = {
  tabs: SegmentedTab<T>[];
  initial?: T;
};

export function SegmentedControl<T extends string>({
  tabs,
  initial,
}: Props<T>) {
  const firstId = tabs[0]?.id;
  const [active, setActive] = useState<T>(initial ?? firstId ?? ("" as T));

  if (tabs.length === 0 || !firstId) return null;

  const current = tabs.find((t) => t.id === active) ?? tabs[0]!;

  return (
    <div>
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="inline-flex rounded-md border border-border bg-surface p-1"
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setActive(t.id)}
              className={`rounded-sm px-4 py-2 text-body-sm font-medium transition-base duration-base ease-standard ${
                isActive
                  ? "bg-accent text-ink-inverse shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="mt-6"
      >
        {current.render()}
      </div>
    </div>
  );
}
