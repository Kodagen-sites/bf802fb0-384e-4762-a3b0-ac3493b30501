"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSite } from "@/lib/site-scope";
import { hasPermission } from "@/lib/audit";
import { services } from "@kodagen/catalog-engine";
import type { ProductStatus } from "@kodagen/catalog-engine";
import { logAudit } from "@/lib/audit";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function bump() {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createProduct(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "products.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const categoryId = String(fd.get("categoryId") ?? "").trim();
    const price = Number(fd.get("price") ?? 0);
    const comparePrice = Number(fd.get("comparePrice") ?? 0);
    const sku = String(fd.get("sku") ?? "").trim();
    const status = (String(fd.get("status") ?? "draft")) as ProductStatus;
    const featured = String(fd.get("featured") ?? "false") === "true";
    const imagesRaw = String(fd.get("images") ?? "[]");
    const attributesRaw = String(fd.get("attributes") ?? "{}");

    if (!name) return { ok: false, error: "Product name is required." };
    if (!Number.isFinite(price) || price < 0) return { ok: false, error: "Invalid price." };

    let images: string[] = [];
    try { images = JSON.parse(imagesRaw); } catch { /* keep empty */ }

    let attributes: Record<string, unknown> = {};
    try { attributes = JSON.parse(attributesRaw); } catch { /* keep empty */ }

    const supabase = await createClient();
    const product = await services.createProduct(supabase, ctx.siteId, {
      name,
      description: description || undefined,
      category_id: categoryId || undefined,
      base_price_cents: Math.round(price * 100),
      compare_at_price_cents: comparePrice > 0 ? Math.round(comparePrice * 100) : undefined,
      sku: sku || undefined,
      status,
      featured,
      images,
      attributes,
    });

    logAudit({ action: "product.create", entityType: "product", entityId: product.id, details: { name, sku } });
    bump();
    return { ok: true, id: product.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateProduct(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "products.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const id = String(fd.get("id") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const categoryId = String(fd.get("categoryId") ?? "").trim();
    const price = Number(fd.get("price") ?? 0);
    const comparePrice = Number(fd.get("comparePrice") ?? 0);
    const sku = String(fd.get("sku") ?? "").trim();
    const status = (String(fd.get("status") ?? "draft")) as ProductStatus;
    const featured = String(fd.get("featured") ?? "false") === "true";
    const imagesRaw = String(fd.get("images") ?? "[]");
    const attributesRaw = String(fd.get("attributes") ?? "{}");

    if (!id) return { ok: false, error: "Missing id." };
    if (!name) return { ok: false, error: "Product name is required." };

    let images: string[] = [];
    try { images = JSON.parse(imagesRaw); } catch { /* keep empty */ }

    let attributes: Record<string, unknown> = {};
    try { attributes = JSON.parse(attributesRaw); } catch { /* keep empty */ }

    const supabase = await createClient();
    await services.updateProduct(supabase, ctx.siteId, id, {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: description || null,
      category_id: categoryId || null,
      base_price_cents: Math.round(price * 100),
      compare_at_price_cents: comparePrice > 0 ? Math.round(comparePrice * 100) : null,
      sku: sku || null,
      status,
      featured,
      images,
      attributes,
    });

    logAudit({ action: "product.update", entityType: "product", entityId: id, details: { name } });
    bump();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteProduct(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "products.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const id = String(fd.get("id") ?? "").trim();
    if (!id) return { ok: false, error: "Missing id." };

    const supabase = await createClient();
    await services.deleteProduct(supabase, ctx.siteId, id);

    logAudit({ action: "product.delete", entityType: "product", entityId: id });
    bump();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function toggleProductStatus(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "products.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const id = String(fd.get("id") ?? "").trim();
    const status = String(fd.get("status") ?? "draft") as ProductStatus;
    if (!id) return { ok: false, error: "Missing id." };

    const supabase = await createClient();
    await services.updateProduct(supabase, ctx.siteId, id, { status });

    logAudit({ action: "product.status", entityType: "product", entityId: id, details: { status } });
    bump();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
