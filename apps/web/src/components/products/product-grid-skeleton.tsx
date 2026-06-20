export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col rounded-[1.75rem] border border-border/70 bg-panel p-7 shadow-card"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          {/* Image placeholder */}
          <div className="skeleton mb-5 h-44 w-full rounded-[1.25rem]" />
          {/* Category + SKU row */}
          <div className="mb-3 flex items-center justify-between">
            <div className="skeleton h-3 w-20 rounded-full" />
            <div className="skeleton h-4 w-16 rounded-full" />
          </div>
          {/* Title */}
          <div className="skeleton mb-2 h-5 w-3/4 rounded-lg" />
          <div className="skeleton mb-1 h-4 w-full rounded-lg" />
          <div className="skeleton mb-5 h-4 w-2/3 rounded-lg" />
          {/* Price + CTA */}
          <div className="mt-auto flex items-center justify-between">
            <div className="skeleton h-4 w-24 rounded-lg" />
            <div className="skeleton h-4 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryFilterSkeleton() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {["All", "", "", "", ""].map((_, i) => (
          <div key={i} className="skeleton h-8 w-16 rounded-full" style={{ width: i === 0 ? 44 : 70 + i * 18 }} />
        ))}
      </div>
      <div className="skeleton h-10 w-full rounded-xl sm:w-56" />
    </div>
  );
}
