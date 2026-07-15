// components/admin/users/CustomerAuditTab.tsx
//
// Audit trail tab — shows admin actions taken against this customer.
// Powered by customer_admin_actions table.

"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserX, Ban, ShieldAlert, RotateCcw, Trash2, Mail, KeyRound,
  Edit, Tag, Download, Skull, AlertCircle,
} from "lucide-react";

type AdminAction = {
  id: string;
  action: string;
  reason: string | null;
  before_state: any;
  after_state: any;
  ip_address: string | null;
  created_at: string;
  admin: { email: string } | null;
};

const ACTION_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  suspended: { icon: UserX, label: "Suspended account", color: "text-orange-600" },
  unsuspended: { icon: RotateCcw, label: "Unsuspended account", color: "text-green-600" },
  banned: { icon: Ban, label: "Banned account", color: "text-red-600" },
  unbanned: { icon: RotateCcw, label: "Unbanned account", color: "text-green-600" },
  shadow_banned: { icon: AlertCircle, label: "Shadow-banned", color: "text-yellow-600" },
  blocked: { icon: ShieldAlert, label: "Blocked from re-signup", color: "text-red-700" },
  unblocked: { icon: RotateCcw, label: "Unblocked", color: "text-green-600" },
  force_logged_out: { icon: RotateCcw, label: "Force logged out", color: "text-orange-600" },
  password_reset_sent: { icon: KeyRound, label: "Sent password reset", color: "text-blue-600" },
  verification_resent: { icon: Mail, label: "Resent verification", color: "text-blue-600" },
  notes_updated: { icon: Edit, label: "Updated internal notes", color: "text-muted-foreground" },
  tags_updated: { icon: Tag, label: "Updated tags", color: "text-muted-foreground" },
  data_exported: { icon: Download, label: "Exported customer data", color: "text-blue-600" },
  deleted_soft: { icon: Trash2, label: "Soft deleted", color: "text-red-600" },
  deleted_hard: { icon: Skull, label: "Hard deleted (GDPR erasure)", color: "text-red-700" },
};

export function CustomerAuditTab({ actions }: { actions: AdminAction[] }) {
  if (actions.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        No admin actions on this customer yet.
      </Card>
    );
  }
  
  return (
    <Card className="divide-y">
      {actions.map((action) => {
        const config = ACTION_CONFIG[action.action] || {
          icon: AlertCircle,
          label: action.action.replace(/_/g, " "),
          color: "text-muted-foreground",
        };
        const Icon = config.icon;
        
        return (
          <div key={action.id} className="p-4 flex items-start gap-3">
            <div className={`mt-0.5 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(action.created_at)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                by {action.admin?.email || "—"}
                {action.ip_address && <> · {action.ip_address}</>}
              </p>
              {action.reason && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <span className="font-medium text-muted-foreground">Reason: </span>
                  {action.reason}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
