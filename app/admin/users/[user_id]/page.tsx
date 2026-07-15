// app/admin/users/[user_id]/page.tsx
//
// Customer detail page with multi-tab layout.
// Translated from working CRM AdminUsers.tsx detail panel (with 4 tabs:
// overview/usage/wallet/actions).
//
// Engine-aware: shows Orders tab for catalog, Bookings tab for booking,
// Tickets tab for tickets, Inquiries tab for crm engine.

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FK_COL } from "@/lib/db-scope";
import { requirePermission } from "@/lib/check-permission";
import { hasPermission } from "@/lib/audit-shared";
import { getSiteConfig } from "@/lib/site-config";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerActionPanel } from "@/components/admin/users/CustomerActionPanel";
import { CustomerActivityList } from "@/components/admin/users/CustomerActivityList";
import { CustomerAuditTab } from "@/components/admin/users/CustomerAuditTab";
import { CustomerNotesEditor } from "@/components/admin/users/CustomerNotesEditor";
import { CustomerEngineTab } from "@/components/admin/users/CustomerEngineTab";

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  suspended: "bg-red-500/10 text-red-700 dark:text-red-400",
  shadow_banned: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  banned: "bg-red-700/10 text-red-700 dark:text-red-400",
  deleted_soft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ user_id: string }> }) {
  const { user_id: userId } = await params;
  
  const supabase = await createClient();
  const { data: { user: admin } } = await supabase.auth.getUser();
  if (!admin) redirect("/admin/login");
  
  const ctx = await requirePermission("customers.view");
  if (!ctx) {
    return <div className="p-8 text-center text-muted-foreground">Permission denied</div>;
  }
  
  const canWrite = hasPermission(ctx.role, "customers.manage", ctx.permissions);
  
  // Fetch customer profile — scoped to THIS site (service-role bypasses RLS,
  // so the site filter is what stops one tenant's admin from opening another
  // tenant's customer by URL: /admin/users/<foreign-user-id>).
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("customer_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq(FK_COL, ctx.siteId)
    .single();

  if (!profile) notFound();
  
  // Fetch auth user (for email, created_at, email_confirmed_at)
  const { data: authData } = await adminClient.auth.admin.getUserById(userId);
  const authUser = authData.user;
  
  // Fetch recent activity (last 50 events)
  const { data: activity } = await adminClient
    .from("customer_activity")
    .select("*")
    .eq("user_id", userId)
    .eq(FK_COL, ctx.siteId)
    .order("created_at", { ascending: false })
    .limit(50);
  
  // Fetch admin actions audit (last 50)
  const { data: adminActions } = await adminClient
    .from("customer_admin_actions")
    .select(`
      *,
      admin:admin_user_id (
        email
      )
    `)
    .eq("customer_user_id", userId)
    .eq("site_id", ctx.siteId)
    .order("created_at", { ascending: false })
    .limit(50);
  
  // Engine info
  const siteConfig = await getSiteConfig();
  const engine = siteConfig.engine;
  
  const customerName = profile.display_name || profile.full_name || authUser?.email?.split("@")[0] || "—";
  
  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/admin/users">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All customers
          </Link>
        </Button>
        
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">{customerName}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{authUser?.email}</span>
              {profile.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone}</span>}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Badge className={STATUS_STYLE[profile.status] || ""}>
                {profile.status.replace(/_/g, " ")}
              </Badge>
              {profile.email_verified_at ? (
                <Badge variant="outline" className="text-green-700 dark:text-green-400">Verified</Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
              {profile.tags?.map((tag: string) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
          
          {canWrite && (
            <CustomerActionPanel
              userId={userId}
              email={authUser?.email ?? ""}
              currentStatus={profile.status}
              role={ctx.role}
            />
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {engine === "catalog" && <TabsTrigger value="orders">Orders</TabsTrigger>}
          {engine === "booking" && <TabsTrigger value="bookings">Bookings</TabsTrigger>}
          {engine === "tickets" && <TabsTrigger value="tickets">Tickets</TabsTrigger>}
          {engine === "crm" && <TabsTrigger value="inquiries">Inquiries</TabsTrigger>}
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Profile</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Display name</dt>
                <dd className="mt-0.5">{profile.display_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Full name</dt>
                <dd className="mt-0.5">{profile.full_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-0.5">{authUser?.email}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="mt-0.5">{profile.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Marketing consent</dt>
                <dd className="mt-0.5">{profile.marketing_consent ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Referral source</dt>
                <dd className="mt-0.5">{profile.referral_source || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last login</dt>
                <dd className="mt-0.5">{profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "Never"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Login count</dt>
                <dd className="mt-0.5">{profile.login_count}</dd>
              </div>
            </dl>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Internal notes</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Visible only to staff. Customer cannot see these notes.
            </p>
            <CustomerNotesEditor
              userId={userId}
              initialNotes={profile.admin_notes || ""}
              canWrite={canWrite}
            />
          </Card>
          
          {(profile.status === "suspended" || profile.status === "banned") && (
            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <h3 className="font-semibold mb-2 text-destructive">
                Account is {profile.status.replace(/_/g, " ")}
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Since</dt>
                  <dd>{new Date(profile.suspended_at || profile.banned_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Reason</dt>
                  <dd>{profile.suspended_reason || profile.banned_reason || "—"}</dd>
                </div>
              </dl>
            </Card>
          )}
        </TabsContent>
        
        {engine && engine !== "none" && (
          <TabsContent value={engine === "catalog" ? "orders" : engine === "booking" ? "bookings" : engine === "tickets" ? "tickets" : "inquiries"}>
            <CustomerEngineTab userId={userId} engine={engine} customerEmail={authUser?.email ?? ""} siteId={ctx.siteId} />
          </TabsContent>
        )}
        
        <TabsContent value="activity">
          <CustomerActivityList activity={activity ?? []} />
        </TabsContent>
        
        <TabsContent value="audit">
          <CustomerAuditTab actions={adminActions ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
