// app/account/page.tsx
//
// Customer dashboard — landing page after login.
// Engine-aware: shows different cards based on siteConfig.engine.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSiteConfig } from "@/lib/site-config";

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  if (profile?.status === "suspended" || profile?.status === "banned") {
    redirect("/account/suspended");
  }
  
  const siteConfig = await getSiteConfig();
  const engine = siteConfig.engine;
  
  // Engine-specific dashboard tiles
  const tiles = [];
  
  if (engine === "catalog") {
    const { data: orders } = await supabase
      .from("orders")
      .select("id, status, total_cents, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    tiles.push({
      title: "My Orders",
      href: "/account/orders",
      count: orders?.length ?? 0,
      preview: orders?.[0] ? `Latest: ${formatCurrency(orders[0].total_cents)} · ${orders[0].status}` : "No orders yet",
    });
  }
  
  if (engine === "booking") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, status, start_date, end_date")
      .eq("customer_email", user.email)
      .order("created_at", { ascending: false })
      .limit(5);
    
    tiles.push({
      title: "My Bookings",
      href: "/account/bookings",
      count: bookings?.length ?? 0,
      preview: bookings?.[0] ? `Next: ${formatDate(bookings[0].start_date)} · ${bookings[0].status}` : "No bookings yet",
    });
  }
  
  if (engine === "tickets") {
    const { data: tickets } = await supabase
      .from("ticket_purchases")
      .select("id, event_name, ticket_count, status")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    
    tiles.push({
      title: "My Tickets",
      href: "/account/tickets",
      count: tickets?.length ?? 0,
      preview: tickets?.[0] ? `${tickets[0].event_name} · ${tickets[0].ticket_count} tickets` : "No tickets yet",
    });
  }
  
  // Universal tiles
  tiles.push({
    title: "Profile & Addresses",
    href: "/account/profile",
    preview: profile?.full_name || profile?.display_name || "Update your profile",
  });
  
  return (
    <div className="container max-w-5xl py-12">
      <h1 className="text-3xl font-semibold mb-2">
        Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
      </h1>
      <p className="text-muted-foreground mb-8">
        {profile?.email_verified_at ? "Your account is verified." : "Please verify your email — check your inbox."}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tiles.map((tile) => (
          <Card key={tile.href} className="p-6">
            <h2 className="text-lg font-semibold mb-2">{tile.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{tile.preview}</p>
            <Button asChild variant="outline" size="sm">
              <Link href={tile.href}>View →</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
