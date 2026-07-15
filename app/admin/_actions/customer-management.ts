// app/admin/_actions/customer-management.ts
//
// Customer management Server Actions.
// Translated from working CRM api/routes/admin.js endpoints (lines 530-680):
//   - GET    /users                     → listCustomers (Server Component query, not here)
//   - PATCH  /users/:id/status          → suspendCustomer / unsuspendCustomer / banCustomer / shadowBanCustomer
//   - POST   /users/:id/force-logout    → forceLogoutCustomer
//   - POST   /users/:id/send-password-reset → sendPasswordReset
//   - DELETE /users/:id                 → softDeleteCustomer / hardDeleteCustomer
//
// Plus new actions:
//   - blockCustomer / unblockCustomer (writes blocked_emails)
//   - exportCustomerData (GDPR export)
//   - updateCustomerNotes / updateCustomerTags
//
// Every action:
//   1. Verifies caller is staff with sufficient permission
//   2. Captures before_state snapshot
//   3. Performs the operation via admin client (service role)
//   4. Writes audit log row to customer_admin_actions AND admin_audit_logs
//   5. Returns { success, error?, message? }

"use server";
import { DB_MODE, FK_COL, KODAGEN_SCHEMA, withSchema } from '@/lib/db-scope';
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/check-permission";
import type { Permission } from "@/lib/audit-shared";

// ─── Permission checking ────────────────────────────────────────────────
// Wraps the existing requirePermission() to return the same shape my actions
// expect. Returns user + site context, or { ok: false, error } on denial.

async function checkAdminPermission(permission: Permission) {
  const ctx = await requirePermission(permission);
  if (!ctx) return { ok: false as const, error: "Permission denied" };
  return {
    ok: true as const,
    user: ctx.user,
    site: { id: ctx.siteId },
    userSite: { role: ctx.role },
    isSuperAdmin: ctx.role === "owner",
  };
}

// ─── Cross-tenant guard ─────────────────────────────────────────────────
// Every action here uses the service-role client (RLS bypassed) and targets a
// customer by `user_id` from the form. In SHARED DB mode the auth pool AND the
// service key are shared across all tenants, so without an explicit site check
// an admin of site A could pass any user_id and act on site B's customer (ban,
// export, delete). This asserts the target is a customer OF THE CALLER'S SITE
// before any mutation or Supabase auth-admin call — the row is looked up by
// (user_id AND FK_COL=siteId), so a foreign customer resolves to null → abort.
// It also guards the multi-site case: the same auth user can have a
// customer_profiles row at several sites, so mutations MUST additionally carry
// `.eq(FK_COL, siteId)` to avoid touching their rows at other sites.
async function assertOwnedCustomer(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  siteId: string,
): Promise<boolean> {
  if (!userId || !siteId) return false;
  const { data } = await adminClient
    .from("customer_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .eq(FK_COL, siteId)
    .maybeSingle();
  return !!data;
}

// ─── Audit logging helper ───────────────────────────────────────────────
// Translated from working CRM api/lib/auditLog.js

async function audit({
  customerId,
  siteId,
  adminId,
  adminEmail,
  action,
  reason,
  beforeState,
  afterState,
  category = "users",
}: {
  customerId: string;
  siteId: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  reason?: string | null;
  beforeState?: any;
  afterState?: any;
  category?: string;
}) {
  const adminClient = createAdminClient();
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || null;
  
  // Write to customer-specific audit table (powers customer detail Audit tab)
  await adminClient.from("customer_admin_actions").insert({
    customer_user_id: customerId,
    site_id: siteId,
    admin_user_id: adminId,
    action,
    reason: reason ?? null,
    before_state: beforeState ?? null,
    after_state: afterState ?? null,
    ip_address: ipAddress,
  });
  
  // Also write to global audit log (powers /admin/audit-logs)
  await adminClient.from("admin_audit_logs").insert({
    site_id: siteId,
    admin_id: adminId,
    admin_email: adminEmail,
    action: `${action}: customer ${customerId}`,
    category,
    target_type: "customer",
    target_id: customerId,
    details: reason ? JSON.stringify({ reason }) : null,
    ip_address: ipAddress,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// SUSPENSION / BAN / SHADOW-BAN
// ═══════════════════════════════════════════════════════════════════════

async function changeCustomerStatus(formData: FormData, newStatus: "suspended" | "banned" | "shadow_banned" | "active") {
  const userId = formData.get("user_id") as string;
  const reason = (formData.get("reason") as string)?.trim();
  
  // Reason required for non-active statuses
  if (newStatus !== "active" && (!reason || reason.length < 10)) {
    return { error: "Reason required (minimum 10 characters)" };
  }
  
  // Permission depends on action: suspend needs customers.suspend, ban needs customers.ban
  const requiredPerm: Permission = (newStatus === "banned" || newStatus === "shadow_banned")
    ? "customers.ban"
    : "customers.suspend";
  const check = await checkAdminPermission(requiredPerm);
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  // Snapshot before (scoped to THIS site's profile)
  const { data: before } = await adminClient
    .from("customer_profiles")
    .select("status, suspended_at, suspended_reason, banned_at, banned_reason, token_version")
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id)
    .single();

  if (!before) return { error: "Customer not found" };
  
  // Build update payload
  const now = new Date().toISOString();
  const update: any = {
    status: newStatus,
    token_version: (before.token_version ?? 0) + 1,  // force-logout
  };
  
  if (newStatus === "suspended") {
    update.suspended_at = now;
    update.suspended_by = check.user.id;
    update.suspended_reason = reason;
  } else if (newStatus === "banned") {
    update.banned_at = now;
    update.banned_by = check.user.id;
    update.banned_reason = reason;
  } else if (newStatus === "active") {
    // Clearing previous suspension/ban
    update.suspended_at = null;
    update.suspended_reason = null;
    update.banned_at = null;
    update.banned_reason = null;
  }
  
  await adminClient
    .from("customer_profiles")
    .update(update)
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id);

  // Enforce the login block. HOW depends on the DB isolation mode, because in
  // shared mode the auth pool is shared across ALL tenants:
  //
  //   SHARED (DB2): an auth-level ban (`ban_duration`) or a global `signOut`
  //   would hit EVERY tenant this person belongs to — the cross-tenant
  //   ban-bleed. So we do NOT touch the shared auth user. Isolation is per
  //   site: customer_profiles.status='suspended'/'banned' (set above) +
  //   token_version bump (above) + the /account middleware status gate, which
  //   resolves status scoped to (this user, this site) and redirects to
  //   /account/suspended on the next protected navigation. Nothing leaks to
  //   the customer's accounts at other tenants.
  //
  //   DEDICATED: isolated auth pool → an auth-level ban is safe and is the
  //   strongest control (blocks login immediately, everywhere on THIS project).
  if (DB_MODE === "shared") {
    // no-op at the auth layer — per-site status + middleware gate own this
  } else if (newStatus === "suspended" || newStatus === "banned") {
    const banDuration = newStatus === "banned" ? "876000h" : "8760h";  // 100 years for ban, 1 year for suspension
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: banDuration,
    });
    // Sign out all their existing sessions
    await adminClient.auth.admin.signOut(userId, "global");
  } else if (newStatus === "active") {
    // Lift the ban
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
  }
  // shadow_banned doesn't restrict login — they stay logged in but features are gated
  
  // Audit
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: newStatus,
    reason,
    beforeState: before,
    afterState: update,
  });
  
  // TODO: send notification email to customer (uses skill's email pipeline)
  
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: `Customer ${newStatus}` };
}

export async function suspendCustomer(formData: FormData) {
  return changeCustomerStatus(formData, "suspended");
}

export async function unsuspendCustomer(formData: FormData) {
  return changeCustomerStatus(formData, "active");
}

export async function banCustomer(formData: FormData) {
  return changeCustomerStatus(formData, "banned");
}

export async function unbanCustomer(formData: FormData) {
  return changeCustomerStatus(formData, "active");
}

export async function shadowBanCustomer(formData: FormData) {
  return changeCustomerStatus(formData, "shadow_banned");
}

// ═══════════════════════════════════════════════════════════════════════
// FORCE LOGOUT (translated from working CRM)
// ═══════════════════════════════════════════════════════════════════════

export async function forceLogoutCustomer(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const check = await checkAdminPermission("customers.manage");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  // Sign out all their sessions globally
  await adminClient.auth.admin.signOut(userId, "global");

  // Increment token_version (defense in depth — even if Supabase signOut races)
  const { data: before } = await adminClient
    .from("customer_profiles")
    .select("token_version")
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id)
    .single();

  await adminClient
    .from("customer_profiles")
    .update({ token_version: (before?.token_version ?? 0) + 1 })
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id);
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "force_logged_out",
  });
  
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: "Customer logged out on all devices" };
}

// ═══════════════════════════════════════════════════════════════════════
// SEND PASSWORD RESET (translated from working CRM)
// ═══════════════════════════════════════════════════════════════════════

export async function sendPasswordReset(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const check = await checkAdminPermission("customers.manage");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  // Get customer email
  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  if (!authUser.user?.email) return { error: "Customer not found" };

  // Generate password recovery link via Supabase Auth Admin API.
  // Supabase emails the user a one-time link; admin never sees the link
  // or the password. This is the secure replacement for the working CRM's
  // approach where a 6-digit code was generated and stored in DB.
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: authUser.user.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/account/reset-password`,
    },
  });
  
  if (linkError) {
    return { error: linkError.message };
  }
  
  // Note: Supabase auto-sends the email. If you want to use your own SMTP
  // (the skill's email smart-fallback), you'd capture linkData.properties.action_link
  // here and route through sendEmail() instead of letting Supabase send.
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "password_reset_sent",
  });
  
  return { success: true, message: "Password reset link sent to customer's email" };
}

// ═══════════════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK (writes blocked_emails — prevents re-signup)
// ═══════════════════════════════════════════════════════════════════════

export async function blockCustomer(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const reason = (formData.get("reason") as string)?.trim();
  
  if (!reason || reason.length < 10) {
    return { error: "Reason required (minimum 10 characters)" };
  }
  const check = await checkAdminPermission("customers.ban");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }
  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  if (!authUser.user?.email) return { error: "Customer not found" };

  // First ban them (so they can't use existing account)
  const banFormData = new FormData();
  banFormData.set("user_id", userId);
  banFormData.set("reason", reason);
  await changeCustomerStatus(banFormData, "banned");
  
  // Then add to blocked_emails (prevents re-signup with same email)
  await adminClient.from("blocked_emails").upsert({
    [FK_COL]: check.site.id,
    email: authUser.user.email.toLowerCase(),
    blocked_by: check.user.id,
    reason,
    unblocked_at: null,
  });
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "blocked",
    reason,
  });
  
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: "Customer blocked. Cannot re-register with this email." };
}

export async function unblockCustomer(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const check = await checkAdminPermission("customers.ban");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }
  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  if (!authUser.user?.email) return { error: "Customer not found" };

  await adminClient
    .from("blocked_emails")
    .update({
      unblocked_at: new Date().toISOString(),
      unblocked_by: check.user.id,
    })
    .eq(FK_COL, check.site.id)
    .eq("email", authUser.user.email.toLowerCase());
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "unblocked",
  });
  
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: "Customer unblocked" };
}

// ═══════════════════════════════════════════════════════════════════════
// SOFT DELETE (translated from working CRM — but soft, not hard)
// ═══════════════════════════════════════════════════════════════════════

export async function softDeleteCustomer(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const reason = (formData.get("reason") as string)?.trim() || "Soft deleted by admin";
  const check = await checkAdminPermission("customers.delete_soft");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  const { data: before } = await adminClient
    .from("customer_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id)
    .single();

  await adminClient
    .from("customer_profiles")
    .update({
      status: "deleted_soft",
      deleted_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id);

  // Block login. Shared DB2 shares the auth pool across tenants, so an
  // auth-level ban would bleed to this person's accounts at other sites — the
  // status='deleted_soft' row (per-site) + the /account middleware gate handle
  // it here. Dedicated projects have an isolated pool → auth ban is safe.
  if (DB_MODE !== "shared") {
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",  // 100 years
    });
    await adminClient.auth.admin.signOut(userId, "global");
  }

  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "deleted_soft",
    reason,
    beforeState: before,
  });
  
  revalidatePath("/admin/users");
  return { success: true, message: "Customer soft-deleted (data retained)" };
}

// ═══════════════════════════════════════════════════════════════════════
// HARD DELETE (GDPR erasure — irreversible)
// ═══════════════════════════════════════════════════════════════════════

export async function hardDeleteCustomer(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const confirmEmail = (formData.get("confirm_email") as string)?.trim().toLowerCase();
  const reason = (formData.get("reason") as string)?.trim() || "GDPR erasure request";
  
  // Hard delete requires owner role (not just any admin)
  const check = await checkAdminPermission("customers.delete_hard");
  if (!check.ok) return { error: check.error };
  if (check.userSite.role !== "owner") {
    return { error: "Only the site owner can hard-delete customers" };
  }
  
  const adminClient = createAdminClient();

  // Cross-tenant guard: the target MUST be a customer of THIS site. Without
  // this, an owner of site A could delete the shared auth user of site B's
  // customer (or even another tenant's staff) by passing their user_id.
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
  if (!authUser.user) return { error: "Customer not found" };

  // Email confirmation gate (prevents fat-finger deletes)
  if (authUser.user.email?.toLowerCase() !== confirmEmail) {
    return { error: "Email confirmation does not match. Type the customer's email to confirm." };
  }

  // Snapshot full data BEFORE deletion (for audit + GDPR record-of-deletion)
  const { data: profile } = await adminClient
    .from("customer_profiles")
    .select("*")
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id)
    .single();

  // Audit FIRST so the action is recorded even before cascade
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "deleted_hard",
    reason,
    beforeState: { profile, email: authUser.user.email },
  });

  // In SHARED mode the auth.users row is GLOBAL — the same person can be a
  // customer of several Kodagen sites (and could even be staff elsewhere).
  // Deleting the auth user would erase their identity everywhere, so we only
  // do the full auth-user delete when this site is their ONLY footprint.
  // Otherwise we erase just THIS site's customer data and leave the shared
  // identity intact (their other sites are unaffected).
  let otherFootprint = false;
  if (FK_COL === "site_id") {
    const [{ count: otherProfiles }, { count: staffMemberships }] = await Promise.all([
      adminClient.from("customer_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", userId).neq(FK_COL, check.site.id),
      adminClient.schema("kodagen").from("user_sites")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);
    otherFootprint = (otherProfiles ?? 0) > 0 || (staffMemberships ?? 0) > 0;
  }

  if (otherFootprint) {
    // Erase only this site's customer footprint; keep the shared auth user.
    await adminClient.from("customer_profiles").delete()
      .eq("user_id", userId).eq(FK_COL, check.site.id);
    await adminClient.from("customer_activity").delete()
      .eq("user_id", userId).eq(FK_COL, check.site.id);
    revalidatePath("/admin/users");
    return { success: true, message: "Customer data erased for this site (shared account retained — they use other Kodagen sites)." };
  }

  // Sole footprint → full cascade delete via auth.users:
  //   customer_profiles / customer_activity / customer_admin_actions (FK CASCADE)
  //   plus engine-specific cascades (orders → customer_id SET NULL/CASCADE)
  await adminClient.auth.admin.deleteUser(userId);

  revalidatePath("/admin/users");
  return { success: true, message: "Customer permanently deleted (GDPR compliant)" };
}

// ═══════════════════════════════════════════════════════════════════════
// GDPR DATA EXPORT
// ═══════════════════════════════════════════════════════════════════════

export async function exportCustomerData(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const check = await checkAdminPermission("customers.export");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  const [
    authUser,
    profile,
    activity,
    adminActions,
  ] = await Promise.all([
    adminClient.auth.admin.getUserById(userId),
    adminClient.from("customer_profiles").select("*").eq("user_id", userId).eq(FK_COL, check.site.id).single(),
    adminClient.from("customer_activity").select("*").eq("user_id", userId).eq(FK_COL, check.site.id).order("created_at", { ascending: false }),
    adminClient.from("customer_admin_actions").select("*").eq("customer_user_id", userId).eq("site_id", check.site.id).order("created_at", { ascending: false }),
  ]);
  
  // Engine-specific data exports happen via separate queries based on siteConfig.engine
  // (orders for catalog, bookings for booking, tickets for tickets, inquiries for crm)
  // See exportEngineData() below for the dispatcher.
  const engineData = await exportEngineData(userId, check.site.id);
  
  const exportPayload = {
    exported_at: new Date().toISOString(),
    exported_by: check.user.email,
    customer: {
      id: userId,
      email: authUser.data.user?.email,
      created_at: authUser.data.user?.created_at,
      email_confirmed_at: authUser.data.user?.email_confirmed_at,
    },
    profile: profile.data,
    activity: activity.data,
    admin_actions_against_account: adminActions.data,
    engine_specific_data: engineData,
  };
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "data_exported",
  });
  
  return { success: true, data: exportPayload };
}

async function exportEngineData(userId: string, siteId: string) {
  const adminClient = createAdminClient();
  const { data: site } = await withSchema(adminClient, KODAGEN_SCHEMA)
    .from("sites")
    .select("config")
    .eq("id", siteId)
    .single();
  
  const engine = site?.config?.engine;
  
  if (engine === "catalog") {
    const { data } = await adminClient
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId);
    return { engine, orders: data };
  }

  if (engine === "booking") {
    const { data } = await adminClient
      .from("bookings")
      .select("*")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId);
    return { engine, bookings: data };
  }

  if (engine === "tickets") {
    const { data } = await adminClient
      .from("ticket_purchases")
      .select("*, tickets(*)")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId);
    return { engine, ticket_purchases: data };
  }
  
  if (engine === "crm") {
    const { data } = await adminClient
      .from("inquiries")
      .select("*")
      .eq("customer_id", userId)
      .eq(FK_COL, siteId);
    return { engine, inquiries: data };
  }
  
  return { engine: "unknown" };
}

// ═══════════════════════════════════════════════════════════════════════
// PROFILE EDITS BY ADMIN (notes, tags)
// ═══════════════════════════════════════════════════════════════════════

export async function updateCustomerNotes(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const notes = formData.get("notes") as string;
  const check = await checkAdminPermission("customers.manage");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  const { data: before } = await adminClient
    .from("customer_profiles")
    .select("admin_notes")
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id)
    .single();

  await adminClient
    .from("customer_profiles")
    .update({ admin_notes: notes || null })
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id);
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "notes_updated",
    beforeState: { admin_notes: before?.admin_notes },
    afterState: { admin_notes: notes || null },
  });
  
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: "Notes updated" };
}

export async function updateCustomerTags(formData: FormData) {
  const userId = formData.get("user_id") as string;
  const tagsJson = formData.get("tags") as string;
  let tags: string[] = [];
  try {
    tags = JSON.parse(tagsJson);
    if (!Array.isArray(tags)) tags = [];
  } catch {
    return { error: "Invalid tags format" };
  }
  const check = await checkAdminPermission("customers.manage");
  if (!check.ok) return { error: check.error };
  
  const adminClient = createAdminClient();
  if (!(await assertOwnedCustomer(adminClient, userId, check.site.id))) {
    return { error: "Customer not found" };
  }

  const { data: before } = await adminClient
    .from("customer_profiles")
    .select("tags")
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id)
    .single();

  await adminClient
    .from("customer_profiles")
    .update({ tags })
    .eq("user_id", userId)
    .eq(FK_COL, check.site.id);
  
  await audit({
    customerId: userId,
    siteId: check.site.id,
    adminId: check.user.id,
    adminEmail: check.user.email ?? null,
    action: "tags_updated",
    beforeState: { tags: before?.tags },
    afterState: { tags },
  });
  
  revalidatePath(`/admin/users/${userId}`);
  return { success: true, message: "Tags updated" };
}
