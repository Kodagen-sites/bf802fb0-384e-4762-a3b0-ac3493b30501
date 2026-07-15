"use server";
import { FK_COL, KODAGEN_SCHEMA, BOOKING_SCHEMA, withSchema } from '@/lib/db-scope';
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSite } from "@/lib/site-scope";
import { hasPermission } from "@/lib/audit";
import { services } from "@kodagen/catalog-engine";
import type { OrderState } from "@kodagen/catalog-engine";
import { logAudit } from "@/lib/audit";

export type OrderResult = { ok: true; reference?: string } | { ok: false; error: string };

function bump() {
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin");
}

export async function transitionOrder(_: OrderResult | null, fd: FormData): Promise<OrderResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };

    const orderId = String(fd.get("orderId") ?? "").trim();
    const newState = String(fd.get("newState") ?? "").trim() as OrderState;
    const reason = String(fd.get("reason") ?? "").trim();
    if (!orderId || !newState) return { ok: false, error: "Missing order or state." };

    // Check appropriate permission based on action
    const permMap: Record<string, string> = {
      confirmed: "orders.modify", processing: "orders.modify",
      shipped: "orders.modify", delivered: "orders.modify",
      cancelled: "orders.cancel", refunded: "orders.cancel",
    };
    const perm = permMap[newState] ?? "orders.modify";
    if (!hasPermission(ctx.role, perm as Parameters<typeof hasPermission>[1], ctx.permissions)) {
      return { ok: false, error: "No permission." };
    }

    const supabase = await createClient();
    const order = await services.transitionOrderState(supabase, ctx.siteId, orderId, newState, reason || undefined);

    logAudit({
      action: `order.${newState}`,
      entityType: "order",
      entityId: order.reference,
      details: { orderId, newState, reason: reason || null },
    });
    bump();
    return { ok: true, reference: order.reference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function markOrderPaid(_: OrderResult | null, fd: FormData): Promise<OrderResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "orders.modify", ctx.permissions)) {
      return { ok: false, error: "No permission." };
    }

    const orderId = String(fd.get("orderId") ?? "").trim();
    if (!orderId) return { ok: false, error: "Missing orderId." };

    const supabase = await createClient();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: now, updated_at: now })
      .eq("id", orderId)
      .eq(FK_COL, ctx.siteId);

    if (error) return { ok: false, error: error.message };

    logAudit({
      action: "order.paid",
      entityType: "order",
      entityId: orderId,
      details: { orderId, method: "manual", markedBy: ctx.user.id },
    });
    bump();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function createAdminOrder(_: OrderResult | null, fd: FormData): Promise<OrderResult> {
  try {
    const ctx = await getCurrentSite();
    if (!ctx) return { ok: false, error: "Not signed in." };
    if (!hasPermission(ctx.role, "orders.create", ctx.permissions)) return { ok: false, error: "No permission." };

    const customerName = String(fd.get("customerName") ?? "").trim();
    const customerEmail = String(fd.get("customerEmail") ?? "").trim();
    const customerPhone = String(fd.get("customerPhone") ?? "").trim();
    const itemsRaw = String(fd.get("items") ?? "[]");
    const shippingCents = Math.round(Number(fd.get("shipping") ?? 0) * 100);
    const discountCents = Math.round(Number(fd.get("discount") ?? 0) * 100);
    const notes = String(fd.get("notes") ?? "").trim();

    if (!customerName) return { ok: false, error: "Customer name is required." };

    let items: Array<{ product_id: string; variant_id?: string; quantity: number }>;
    try { items = JSON.parse(itemsRaw); } catch { return { ok: false, error: "Invalid items." }; }
    if (!items.length) return { ok: false, error: "Add at least one item." };

    const supabase = await createClient();
    const order = await services.createOrder(supabase, ctx.siteId, {
      customer: {
        full_name: customerName,
        email: customerEmail || undefined,
        phone: customerPhone || undefined,
      },
      items,
      shipping_cents: shippingCents,
      discount_cents: discountCents,
      notes: notes || undefined,
      fields: { source: "admin" },
    });

    logAudit({
      action: "order.create",
      entityType: "order",
      entityId: order.reference,
      details: { customerName, itemCount: items.length, source: "admin" },
    });
    bump();
    return { ok: true, reference: order.reference };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
