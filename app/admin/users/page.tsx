// app/admin/users/page.tsx
//
// Admin customer list page. Server Component fetches customer data,
// passes to Client Component for filtering/sorting/search.
//
// Translated from working CRM src/pages/admin/AdminUsers.tsx (1106 lines).
// Keeps the structure: filters, status badges, action menu per row,
// bulk actions, CSV/Excel export.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FK_COL, KODAGEN_SCHEMA, withSchema } from "@/lib/db-scope";
import { requirePermission } from "@/lib/check-permission";
import { hasPermission } from "@/lib/audit-shared";
import { CustomersTable } from "@/components/admin/users/CustomersTable";

export const metadata = {
  title: "Admin — Customers",
};

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  
  const ctx = await requirePermission("customers.view");
  if (!ctx) {
    return <div className="p-8 text-center text-muted-foreground">Permission denied</div>;
  }
  
  const canWrite = hasPermission(ctx.role, "customers.manage", ctx.permissions);
  
  // Fetch all customers for this site with profile + activity stats
  // Translated from working CRM admin.js GET /users endpoint (lines 536-590)
  const { data: customers } = await supabase
    .from("customer_profiles")
    .select(`
      user_id,
      display_name,
      full_name,
      phone,
      status,
      email_verified_at,
      last_login_at,
      login_count,
      created_at,
      tags,
      referral_source
    `)
    // Explicit site scope — don't rely on RLS alone. In shared mode this is
    // what keeps the list to THIS tenant's customers.
    .eq(FK_COL, ctx.siteId)
    .order("created_at", { ascending: false });
  
  // Fetch corresponding auth.users emails (separate join because RLS on auth.users)
  const userIds = customers?.map(c => c.user_id) ?? [];
  const { data: authUsers } = userIds.length > 0
    ? await withSchema(supabase, KODAGEN_SCHEMA).rpc("get_users_emails", { p_site_id: ctx.siteId, user_ids: userIds })
    : { data: [] };
  
  const emailMap = new Map((authUsers ?? []).map((u: any) => [u.id, u.email]));
  
  const enrichedCustomers = (customers ?? []).map(c => ({
    ...c,
    email: (emailMap.get(c.user_id) as string) || "—",
  }));
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enrichedCustomers.length} {enrichedCustomers.length === 1 ? "customer" : "customers"}
          </p>
        </div>
      </div>
      
      <CustomersTable
        customers={enrichedCustomers}
        canWrite={canWrite}
      />
    </div>
  );
}
