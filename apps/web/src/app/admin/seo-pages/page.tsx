export default function AdminSeoPagesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold">SEO Page Builder</h1>
        <button type="button" className="rounded-full bg-accent px-5 py-3 font-semibold text-white">
          New Landing Page
        </button>
      </div>
      <div className="mt-8 rounded-[2rem] border border-border bg-panel p-6">
        <p className="text-sm text-muted">
          The editor contract is section-based: hero, feature-grid, stats, CTA banner, FAQ, and rich text.
        </p>
      </div>
    </div>
  );
}
