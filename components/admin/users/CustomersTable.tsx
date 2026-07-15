// components/admin/users/CustomersTable.tsx
//
// Customer list table with filters, search, action menu, bulk actions.
// Translated from working CRM AdminUsers.tsx (1106 lines, distilled to essentials).

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, MoreVertical, Mail, Ban, UserX, ShieldAlert, Trash2, RotateCcw, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  suspendCustomer,
  unsuspendCustomer,
  banCustomer,
  unbanCustomer,
  forceLogoutCustomer,
  sendPasswordReset,
  blockCustomer,
  softDeleteCustomer,
} from "@/app/admin/_actions/customer-management";

type Customer = {
  user_id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
  status: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  login_count: number;
  created_at: string;
  tags: string[];
  referral_source: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  suspended: "bg-red-500/10 text-red-700 dark:text-red-400",
  shadow_banned: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  banned: "bg-red-700/10 text-red-700 dark:text-red-400",
  deleted_soft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  pending_verification: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  suspended: "Suspended",
  shadow_banned: "Shadow-banned",
  banned: "Banned",
  deleted_soft: "Deleted",
  pending_verification: "Unverified",
};

export function CustomersTable({ customers, canWrite }: { customers: Customer[]; canWrite: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<"all" | "verified" | "unverified">("all");
  const [actionDialog, setActionDialog] = useState<{ type: string; customer: Customer } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const filtered = useMemo(() => {
    return customers.filter(c => {
      // Search
      if (search) {
        const s = search.toLowerCase();
        const match = c.email.toLowerCase().includes(s)
          || c.display_name?.toLowerCase().includes(s)
          || c.full_name?.toLowerCase().includes(s)
          || c.phone?.toLowerCase().includes(s)
          || c.user_id.toLowerCase().includes(s);
        if (!match) return false;
      }
      // Status
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      // Verified
      if (verifiedFilter === "verified" && !c.email_verified_at) return false;
      if (verifiedFilter === "unverified" && c.email_verified_at) return false;
      return true;
    });
  }, [customers, search, statusFilter, verifiedFilter]);
  
  const handleAction = async () => {
    if (!actionDialog) return;
    setSubmitting(true);
    
    const formData = new FormData();
    formData.set("user_id", actionDialog.customer.user_id);
    if (reason) formData.set("reason", reason);
    
    let result: { success?: boolean; error?: string; message?: string } = {};
    
    try {
      switch (actionDialog.type) {
        case "suspend": result = await suspendCustomer(formData); break;
        case "unsuspend": result = await unsuspendCustomer(formData); break;
        case "ban": result = await banCustomer(formData); break;
        case "unban": result = await unbanCustomer(formData); break;
        case "force_logout": result = await forceLogoutCustomer(formData); break;
        case "password_reset": result = await sendPasswordReset(formData); break;
        case "block": result = await blockCustomer(formData); break;
        case "soft_delete": result = await softDeleteCustomer(formData); break;
      }
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.message || "Action completed");
        setActionDialog(null);
        setReason("");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Status: {statusFilter === "all" ? "All" : STATUS_LABEL[statusFilter]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>Suspended</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("shadow_banned")}>Shadow-banned</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("banned")}>Banned</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending_verification")}>Unverified</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("deleted_soft")}>Deleted</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {verifiedFilter === "all" ? "All emails" : verifiedFilter === "verified" ? "Verified only" : "Unverified only"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setVerifiedFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerifiedFilter("verified")}>Verified only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVerifiedFilter("unverified")}>Unverified only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Logins</th>
              <th className="px-4 py-3 font-medium">Last login</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No customers match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(c => (
                <tr key={c.user_id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${c.user_id}`} className="hover:underline">
                      <div className="font-medium">{c.display_name || c.full_name || c.email.split("@")[0]}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                      {!c.email_verified_at && (
                        <Badge variant="outline" className="mt-1 text-xs">Unverified</Badge>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_STYLE[c.status] || ""}>
                      {STATUS_LABEL[c.status] || c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.login_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.last_login_at ? formatRelative(c.last_login_at) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatRelative(c.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${c.user_id}`}>View details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setActionDialog({ type: "password_reset", customer: c })}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send password reset
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setActionDialog({ type: "force_logout", customer: c })}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Force logout
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {c.status === "active" && (
                            <>
                              <DropdownMenuItem onClick={() => setActionDialog({ type: "suspend", customer: c })}>
                                <UserX className="w-4 h-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActionDialog({ type: "ban", customer: c })}>
                                <Ban className="w-4 h-4 mr-2" />
                                Ban
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setActionDialog({ type: "block", customer: c })}>
                                <ShieldAlert className="w-4 h-4 mr-2" />
                                Block (prevent re-signup)
                              </DropdownMenuItem>
                            </>
                          )}
                          {c.status === "suspended" && (
                            <DropdownMenuItem onClick={() => setActionDialog({ type: "unsuspend", customer: c })}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Unsuspend
                            </DropdownMenuItem>
                          )}
                          {c.status === "banned" && (
                            <DropdownMenuItem onClick={() => setActionDialog({ type: "unban", customer: c })}>
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Unban
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setActionDialog({ type: "soft_delete", customer: c })}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Soft delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Confirmation dialog for destructive actions */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => { if (!open) { setActionDialog(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle(actionDialog?.type)}</DialogTitle>
            <DialogDescription>
              {getDialogDescription(actionDialog?.type, actionDialog?.customer.email)}
            </DialogDescription>
          </DialogHeader>
          
          {needsReason(actionDialog?.type) && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required, minimum 10 characters)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're taking this action. This is logged."
                rows={3}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setReason(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting || (needsReason(actionDialog?.type) && reason.length < 10)}
              variant={isDestructive(actionDialog?.type) ? "destructive" : "default"}
            >
              {submitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getDialogTitle(type?: string) {
  switch (type) {
    case "suspend": return "Suspend customer?";
    case "unsuspend": return "Unsuspend customer?";
    case "ban": return "Ban customer?";
    case "unban": return "Unban customer?";
    case "block": return "Block customer?";
    case "force_logout": return "Force logout?";
    case "password_reset": return "Send password reset?";
    case "soft_delete": return "Soft delete customer?";
    default: return "Confirm action";
  }
}

function getDialogDescription(type?: string, email?: string) {
  switch (type) {
    case "suspend": return `${email} will lose access immediately and be logged out of all devices. They can be unsuspended later.`;
    case "unsuspend": return `${email} will regain access immediately.`;
    case "ban": return `${email} will lose access permanently. They will be logged out of all devices and cannot log in again unless unbanned.`;
    case "unban": return `${email} will regain ability to log in.`;
    case "block": return `${email} will be banned AND prevented from creating a new account with this email. Stronger than ban.`;
    case "force_logout": return `${email} will be logged out of all devices. They can log in again immediately if they want.`;
    case "password_reset": return `${email} will receive an email with a link to set a new password.`;
    case "soft_delete": return `${email}'s account will be hidden but data is retained. They cannot log in. Restorable.`;
    default: return "";
  }
}

function needsReason(type?: string) {
  return ["suspend", "ban", "block"].includes(type ?? "");
}

function isDestructive(type?: string) {
  return ["suspend", "ban", "block", "soft_delete"].includes(type ?? "");
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
