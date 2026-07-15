import { redirect } from "next/navigation";
import { getCurrentSite } from "@/lib/site-scope";
import { loadSiteConfigFromDB } from "@/lib/load-site-config";
import { createClient } from "@/lib/supabase/server";
import { services } from "@kodagen/catalog-engine";
import ProductsView from "./products-view";

export default async function ProductsPage() {
  const ctx = await getCurrentSite();
  if (!ctx) redirect("/admin/login");

  const config = await loadSiteConfigFromDB(ctx.site?.slug ?? "");
  if (!config) redirect("/admin/login");
  const supabase = await createClient();

  const [products, categories] = await Promise.all([
    services.listProducts(supabase, ctx.siteId),
    services.listCategories(supabase, ctx.siteId),
  ]);

  return (
    <ProductsView
      config={config}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description ?? "",
        images: p.images,
        price: p.base_price_cents / 100,
        comparePrice: p.compare_at_price_cents ? p.compare_at_price_cents / 100 : null,
        sku: p.sku ?? "",
        categoryId: p.category_id ?? "",
        categoryName: categories.find((c) => c.id === p.category_id)?.name ?? "Uncategorized",
        status: p.status,
        featured: p.featured,
        attributes: p.attributes as Record<string, unknown>,
        createdAt: p.created_at,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
