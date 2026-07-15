// components/admin/users/CustomerEngineTab.tsx
//
// Engine-aware tab — dispatches to the right view based on siteConfig.engine.
//   catalog → Orders list
//   booking → Bookings list
//   tickets → Ticket purchases list
//   crm     → Inquiries list

import { createAdminClient } from "@/lib/supabase/admin";
import { FK_COL } from "@/lib/db-scope";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function CustomerEngineTab({
  userId,
  engine,
  customerEmail,
  siteId,
}: {
  userId: string;
  engine: string;
  customerEmail: string;
  // REQUIRED for tenant isolation — every query below scopes by it. Without
  // it the service-role client would list a customer's rows across ALL sites.
  siteId: string;
}) {
  const adminClient = createAdminClient();
  
  if (engine === "catalog") {
    const { data: orders } = await adminClient
      .from("orders")
      .select("id, status, total_cents, item_count, created_at, fulfillment_status")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!orders || orders.length === 0) {
      return <Card className="p-12 text-center text-muted-foreground">No orders yet.</Card>;
    }
    
    return (
      <Card className="divide-y">
        {orders.map(o => (
          <div key={o.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Order #{o.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {o.item_count} {o.item_count === 1 ? "item" : "items"} · {formatDate(o.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{o.status}</Badge>
              <p className="font-semibold">${(o.total_cents / 100).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </Card>
    );
  }
  
  if (engine === "booking") {
    const { data: bookings } = await adminClient
      .from("bookings")
      .select("id, status, start_date, end_date, party_size, total_cents, created_at")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!bookings || bookings.length === 0) {
      return <Card className="p-12 text-center text-muted-foreground">No bookings yet.</Card>;
    }
    
    return (
      <Card className="divide-y">
        {bookings.map(b => (
          <div key={b.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">Booking #{b.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(b.start_date)} → {formatDate(b.end_date)} · {b.party_size} guests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{b.status}</Badge>
              {b.total_cents > 0 && <p className="font-semibold">${(b.total_cents / 100).toFixed(2)}</p>}
            </div>
          </div>
        ))}
      </Card>
    );
  }
  
  if (engine === "tickets") {
    const { data: purchases } = await adminClient
      .from("ticket_purchases")
      .select("id, event_name, ticket_count, status, total_cents, created_at")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!purchases || purchases.length === 0) {
      return <Card className="p-12 text-center text-muted-foreground">No ticket purchases yet.</Card>;
    }
    
    return (
      <Card className="divide-y">
        {purchases.map(p => (
          <div key={p.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{p.event_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {p.ticket_count} {p.ticket_count === 1 ? "ticket" : "tickets"} · {formatDate(p.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline">{p.status}</Badge>
              <p className="font-semibold">${(p.total_cents / 100).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </Card>
    );
  }
  
  if (engine === "crm") {
    const { data: inquiries } = await adminClient
      .from("inquiries")
      .select("id, subject, status, type, created_at")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId)
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (!inquiries || inquiries.length === 0) {
      return <Card className="p-12 text-center text-muted-foreground">No inquiries from this customer.</Card>;
    }
    
    return (
      <Card className="divide-y">
        {inquiries.map(i => (
          <div key={i.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{i.subject}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {i.type} · {formatDate(i.created_at)}
              </p>
            </div>
            <Badge variant="outline">{i.status}</Badge>
          </div>
        ))}
      </Card>
    );
  }
  
  return <Card className="p-12 text-center text-muted-foreground">No data for this engine.</Card>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
