"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSite } from "@/lib/site-scope";
import { hasPermission } from "@/lib/audit";
import { services } from "@kodagen/catalog-engine";
import { logAudit } from "@/lib/audit";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function bump() {
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createCategory(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "categories.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const image = String(fd.get("image") ?? "").trim();
    const parentId = String(fd.get("parentId") ?? "").trim();

    if (!name) return { ok: false, error: "Category name is required." };

    const supabase = await createClient();
    const cat = await services.createCategory(supabase, ctx.siteId, {
      name,
      description: description || undefined,
      image: image || undefined,
      parent_id: parentId || undefined,
    });

    logAudit({ action: "category.create", entityType: "category", entityId: cat.id, details: { name } });
    bump();
    return { ok: true, id: cat.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function updateCategory(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "categories.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const id = String(fd.get("id") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const image = String(fd.get("image") ?? "").trim();
    const active = String(fd.get("active") ?? "true") === "true";

    if (!id) return { ok: false, error: "Missing id." };
    if (!name) return { ok: false, error: "Category name is required." };

    const supabase = await createClient();
    await services.updateCategory(supabase, ctx.siteId, id, {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: description || null,
      image: image || null,
      active,
    });

    logAudit({ action: "category.update", entityType: "category", entityId: id, details: { name } });
    bump();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteCategory(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "categories.edit", ctx.permissions)) return { ok: false, error: "No permission." };

    const id = String(fd.get("id") ?? "").trim();
    if (!id) return { ok: false, error: "Missing id." };

    const supabase = await createClient();
    await services.deleteCategory(supabase, ctx.siteId, id);

    logAudit({ action: "category.delete", entityType: "category", entityId: id });
    bump();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
