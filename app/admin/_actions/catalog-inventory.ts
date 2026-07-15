"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSite } from "@/lib/site-scope";
import { hasPermission } from "@/lib/audit";
import { services } from "@kodagen/catalog-engine";
import { logAudit } from "@/lib/audit";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function adjustStock(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "inventory.adjust", ctx.permissions)) return { ok: false, error: "No permission." };

    const variantId = String(fd.get("variantId") ?? "").trim();
    const adjustment = Number(fd.get("adjustment") ?? 0);
    const reason = String(fd.get("reason") ?? "manual").trim();

    if (!variantId) return { ok: false, error: "Missing variant." };
    if (!adjustment || !Number.isFinite(adjustment)) return { ok: false, error: "Invalid adjustment." };

    const supabase = await createClient();
    await services.adjustInventory(supabase, ctx.siteId, variantId, adjustment, reason, ctx.user.id);

    logAudit({
      action: "inventory.adjust",
      entityType: "variant",
      entityId: variantId,
      details: { adjustment, reason },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function createVariant(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "products.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const productId = String(fd.get("productId") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim();
    const sku = String(fd.get("sku") ?? "").trim();
    const priceCents = fd.get("price") ? Math.round(Number(fd.get("price")) * 100) : undefined;
    const inventoryQty = Number(fd.get("inventoryQty") ?? 0);
    const lowStockThreshold = Number(fd.get("lowStockThreshold") ?? 5);
    const attributesRaw = String(fd.get("attributes") ?? "{}");

    if (!productId) return { ok: false, error: "Missing product." };
    if (!name) return { ok: false, error: "Variant name is required." };

    let attributes: Record<string, unknown> = {};
    try { attributes = JSON.parse(attributesRaw); } catch { /* empty */ }

    const supabase = await createClient();
    await services.createVariant(supabase, ctx.siteId, {
      product_id: productId,
      name,
      sku: sku || undefined,
      price_cents: priceCents,
      attributes,
      inventory_qty: inventoryQty,
      low_stock_threshold: lowStockThreshold,
    });

    logAudit({ action: "variant.create", entityType: "variant", details: { productId, name } });
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteVariant(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "products.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const variantId = String(fd.get("variantId") ?? "").trim();
    if (!variantId) return { ok: false, error: "Missing variant." };

    const supabase = await createClient();
    await services.deleteVariant(supabase, ctx.siteId, variantId);

    logAudit({ action: "variant.delete", entityType: "variant", entityId: variantId });
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
