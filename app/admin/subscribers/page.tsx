// app/admin/subscribers/page.tsx
//
// Admin view of newsletter subscribers.
// List, filter, export to CSV, soft-delete (mark unsubscribed).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FK_COL } from "@/lib/db-scope";
import { requirePermission } from "@/lib/check-permission";
import { hasPermission } from "@/lib/audit-shared";
import { SubscribersTable } from "@/components/admin/subscribers/SubscribersTable";

export const metadata = {
  title: "Admin — Subscribers",
};

export default async function AdminSubscribersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  
  const ctx = await requirePermission("subscribers.view");
  if (!ctx) {
    return <div className="p-8 text-center text-muted-foreground">Permission denied</div>;
  }
  
  const canManage = hasPermission(ctx.role, "subscribers.manage", ctx.permissions);
  
  const { data: subscribers } = await supabase
    .from("subscribers")
    .select("*")
    .eq(FK_COL, ctx.siteId)
    .order("created_at", { ascending: false });
  
  const active = (subscribers ?? []).filter(s => !s.unsubscribed_at).length;
  const unsubscribed = (subscribers ?? []).length - active;
  
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Subscribers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {active} active · {unsubscribed} unsubscribed
        </p>
      </div>
      
      <SubscribersTable
        subscribers={subscribers ?? []}
        canManage={canManage}
      />
    </div>
  );
}
