const columns = ["Name", "SKU", "Status", "Featured"];

export default function AdminProductsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-semibold">Product Management</h1>
        <button type="button" className="rounded-full bg-accent px-5 py-3 font-semibold text-white">
          Add Product
        </button>
      </div>
      <div className="mt-8 overflow-hidden rounded-[2rem] border border-border bg-panel">
        <div className="grid grid-cols-4 border-b border-border px-6 py-4 text-sm font-semibold">
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        <div className="px-6 py-10 text-sm text-muted">Bind this screen to `/api/v1/products` and category endpoints.</div>
      </div>
    </div>
  );
}
