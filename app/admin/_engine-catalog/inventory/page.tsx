import { redirect } from "next/navigation";
import { getCurrentSite } from "@/lib/site-scope";
import { loadSiteConfigFromDB } from "@/lib/load-site-config";
import { createClient } from "@/lib/supabase/server";
import { services } from "@kodagen/catalog-engine";
import InventoryView from "./inventory-view";

export default async function InventoryPage() {
  const ctx = await getCurrentSite();
  if (!ctx) redirect("/admin/login");

  const config = await loadSiteConfigFromDB(ctx.site?.slug ?? "");
  if (!config) redirect("/admin/login");
  const supabase = await createClient();

  // Fetch all products with their variants for inventory view
  const products = await services.listProducts(supabase, ctx.siteId);
  const allVariants: Array<{
    id: string; productId: string; productName: string;
    name: string; sku: string; qty: number; threshold: number; active: boolean;
    priceCents: number | null;
  }> = [];

  for (const product of products) {
    const variants = await services.listVariants(supabase, ctx.siteId, product.id);
    for (const v of variants) {
      allVariants.push({
        id: v.id,
        productId: product.id,
        productName: product.name,
        name: v.name,
        sku: v.sku ?? "",
        qty: v.inventory_qty,
        threshold: v.low_stock_threshold,
        active: v.active,
        priceCents: v.price_cents ?? product.base_price_cents,
      });
    }
  }

  // Recent inventory log
  const log = await services.getInventoryLog(supabase, ctx.siteId, { limit: 50 });

  return (
    <InventoryView
      config={config}
      variants={allVariants}
      recentLog={log.map((l) => ({
        id: l.id,
        variantId: l.variant_id,
        adjustment: l.adjustment,
        reason: l.reason ?? "",
        createdAt: l.created_at,
      }))}
    />
  );
}
