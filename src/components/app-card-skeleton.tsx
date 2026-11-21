export function AppCardSkeleton() {
  return (
    <div
      className="surface-card animate-pulse p-5"
      aria-hidden="true"
      role="presentation"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-surface-2" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 rounded bg-surface-2" />
          <div className="h-3 w-1/2 rounded bg-surface-2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-surface-2" />
        <div className="h-3 w-5/6 rounded bg-surface-2" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-20 rounded-full bg-surface-2" />
        <div className="h-6 w-16 rounded-full bg-surface-2" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-11 flex-1 rounded-lg bg-surface-2" />
        <div className="h-11 w-24 rounded-lg bg-surface-2" />
      </div>
    </div>
  );
}
