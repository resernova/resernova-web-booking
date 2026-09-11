/**
 * Loading state for the booking wizard route.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="mb-8 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="grid grid-cols-[auto_1fr] items-center gap-2">
            <div className="size-9 animate-pulse rounded-full bg-zinc-200" />
            <div className="h-2 animate-pulse rounded bg-zinc-200" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-[var(--color-border)] bg-white p-8 shadow-card">
        <div className="h-7 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="mt-4 h-4 w-72 animate-pulse rounded bg-zinc-100" />
        <div className="mt-8 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      </div>
    </div>
  );
}