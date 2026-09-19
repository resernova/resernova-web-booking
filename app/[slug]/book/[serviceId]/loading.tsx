/**
 * Loading state for the booking wizard route.
 * Token-aligned skeleton that mirrors the real 35/65 split layout
 * to prevent CLS on hydration.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[35%_1fr]">
        {/* Sidebar summary skeleton */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="size-12 shrink-0 animate-pulse rounded-md bg-surface" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-surface" />
              </div>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
              <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-surface" />
            </div>
          </div>
        </aside>

        {/* Form skeleton */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm sm:p-8">
          {/* Date & time section */}
          <div>
            <div className="h-5 w-32 animate-pulse rounded bg-surface" />
            <div className="mt-4 mb-2 flex items-center justify-between">
              <div className="h-3 w-28 animate-pulse rounded bg-surface" />
              <div className="flex gap-1">
                <div className="size-8 animate-pulse rounded-md bg-surface" />
                <div className="size-8 animate-pulse rounded-md bg-surface" />
              </div>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 w-16 shrink-0 animate-pulse rounded-md bg-surface"
                />
              ))}
            </div>
          </div>

          {/* Form fields skeleton */}
          <div className="mt-6 border-t border-border pt-6">
            <div className="h-5 w-40 animate-pulse rounded bg-surface" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-24 animate-pulse rounded bg-surface" />
                  <div className="mt-1 h-10 w-full animate-pulse rounded-md bg-surface" />
                </div>
              ))}
            </div>
          </div>

          {/* Submit button skeleton */}
          <div className="mt-6 border-t border-border pt-6">
            <div className="h-12 w-full animate-pulse rounded-md bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}
