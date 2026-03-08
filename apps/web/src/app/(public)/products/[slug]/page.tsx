import Link from "next/link";
import { apiClient } from "../../../../lib/api-client";
import { QuoteForm } from "../../../../components/forms/quote-form";

export default async function ProductDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await apiClient.getProduct(slug);

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
      <article>
        <Link href="/products" className="text-sm text-accent">
          Back to products
        </Link>
        <h1 className="mt-4 text-4xl font-semibold">{product.name}</h1>
        <p className="mt-4 text-lg text-muted">{product.description}</p>
        <div className="mt-8 rounded-[2rem] border border-border bg-panel p-6">
          <h2 className="text-xl font-semibold">Specifications</h2>
          <div className="mt-4 grid gap-3">
            {product.specifications.map((spec) => (
              <div key={spec.label} className="flex justify-between border-b border-border pb-3 text-sm">
                <span>{spec.label}</span>
                <span className="text-muted">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
      <aside>
        <QuoteForm productId={product._id} />
      </aside>
    </div>
  );
}
