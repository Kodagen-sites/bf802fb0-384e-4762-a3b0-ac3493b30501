import { FK_COL } from '@/lib/db-scope';
import { redirect } from "next/navigation";
import { getCurrentSite } from "@/lib/site-scope";
import { loadSiteConfigFromDB } from "@/lib/load-site-config";
import { createClient } from "@/lib/supabase/server";
import { services } from "@kodagen/catalog-engine";
import CategoriesView from "./categories-view";

export default async function CategoriesPage() {
  const ctx = await getCurrentSite();
  if (!ctx) redirect("/admin/login");

  const config = await loadSiteConfigFromDB(ctx.site?.slug ?? "");
  if (!config) redirect("/admin/login");
  const supabase = await createClient();

  const categories = await services.listCategories(supabase, ctx.siteId);

  // Count products per category
  const { data: productCounts } = await supabase.schema("catalog").from("products")
    .select("category_id").eq(FK_COL, ctx.siteId);

  const countMap = (productCounts ?? []).reduce<Record<string, number>>((acc, row) => {
    const cat = row.category_id as string;
    if (cat) acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <CategoriesView
      config={config}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        image: c.image ?? "",
        parentId: c.parent_id ?? "",
        active: c.active,
        productCount: countMap[c.id] ?? 0,
      }))}
    />
  );
}
