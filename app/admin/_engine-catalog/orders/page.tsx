import { FK_COL } from '@/lib/db-scope';
import { redirect } from "next/navigation";
import { getCurrentSite } from "@/lib/site-scope";
import { loadSiteConfigFromDB } from "@/lib/load-site-config";
import { createClient } from "@/lib/supabase/server";
import OrdersView from "./orders-view";

export default async function OrdersPage() {
  const ctx = await getCurrentSite();
  if (!ctx) redirect("/admin/login");

  const config = await loadSiteConfigFromDB(ctx.site?.slug ?? "");
  if (!config) redirect("/admin/login");
  const supabase = await createClient();

  // Query orders directly with all real columns (avoids services abstraction mismatch).
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("id, guest_email, guest_name, guest_phone, shipping_address, items, subtotal, total, notes, status, payment_provider, payment_ref, paid_at, created_at")
    .eq(FK_COL, ctx.siteId)
    .order("created_at", { ascending: false })
    .limit(200);

  const orders = rawOrders ?? [];

  return (
    <OrdersView
      config={config}
      orders={orders.map((o) => {
        const items = Array.isArray(o.items) ? o.items as Array<{ name: string; qty: number; price: number; variant?: string }> : [];
        const addr  = o.shipping_address as Record<string, string> | null;
        return {
          id:              o.id as string,
          reference:       String(o.id).slice(0, 8).toUpperCase(),
          customerName:    (o.guest_name  as string) || "Guest",
          state:           (o.status as string) || "pending",
          totalCents:      Number(o.total),
          currency:        (o.notes as string) || "EUR",
          itemCount:       items.length,
          createdAt:       o.created_at as string,
          paymentProvider: (o.payment_provider as string) || "",
          paidAt:          (o.paid_at as string | null) ?? null,
        };
      })}
    />
  );
}
