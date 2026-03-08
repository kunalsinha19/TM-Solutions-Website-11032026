import { apiClient } from "../../../lib/api-client";
import { ProductCard } from "../../../components/products/product-card";

export default async function ProductsPage() {
  const products = await apiClient.getProducts().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-semibold">Products</h1>
      <p className="mt-3 text-muted">SEO-friendly product listing with category and featured expansion points.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
