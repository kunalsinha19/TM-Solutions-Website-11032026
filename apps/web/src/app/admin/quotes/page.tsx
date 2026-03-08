export default function AdminQuotesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Quote Requests</h1>
      <div className="mt-8 rounded-[2rem] border border-border bg-panel p-6">
        <p className="text-sm text-muted">Wire this page to `/api/v1/quotes` for status management and re-notify actions.</p>
      </div>
    </div>
  );
}
