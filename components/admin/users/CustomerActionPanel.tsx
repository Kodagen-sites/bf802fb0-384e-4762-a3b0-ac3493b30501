// components/admin/users/CustomerActionPanel.tsx
//
// Sidebar action panel on customer detail page.
// Translated from working CRM AdminUsers.tsx detail panel "actions" tab.

"use client";

import { useState } from "react";
import { Mail, RotateCcw, UserX, Ban, ShieldAlert, Trash2, Download, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  hardDeleteCustomer,
  exportCustomerData,
} from "@/app/admin/_actions/customer-management";

export function CustomerActionPanel({
  userId,
  email,
  currentStatus,
  role,
}: {
  userId: string;
  email: string;
  currentStatus: string;
  role: string;
}) {
  const [dialog, setDialog] = useState<{ type: string } | null>(null);
  const [reason, setReason] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const isOwner = role === "owner";
  
  const handleAction = async () => {
    if (!dialog) return;
    setSubmitting(true);
    
    const formData = new FormData();
    formData.set("user_id", userId);
    if (reason) formData.set("reason", reason);
    if (confirmEmail) formData.set("confirm_email", confirmEmail);
    
    let result: { success?: boolean; error?: string; message?: string; data?: any } = {};
    
    try {
      switch (dialog.type) {
        case "suspend": result = await suspendCustomer(formData); break;
        case "unsuspend": result = await unsuspendCustomer(formData); break;
        case "ban": result = await banCustomer(formData); break;
        case "unban": result = await unbanCustomer(formData); break;
        case "force_logout": result = await forceLogoutCustomer(formData); break;
        case "password_reset": result = await sendPasswordReset(formData); break;
        case "block": result = await blockCustomer(formData); break;
        case "soft_delete": result = await softDeleteCustomer(formData); break;
        case "hard_delete": result = await hardDeleteCustomer(formData); break;
        case "export":
          result = await exportCustomerData(formData);
          if (result.success && result.data) {
            // Download as JSON
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `customer-data-${userId}-${new Date().toISOString().split("T")[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }
          break;
      }
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success(result.message || "Action completed");
        setDialog(null);
        setReason("");
        setConfirmEmail("");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <>
      <Card className="p-4 w-72 space-y-2 sticky top-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Actions</p>
        
        <Button variant="outline" className="w-full justify-start" size="sm"
          onClick={() => setDialog({ type: "password_reset" })}>
          <Mail className="w-4 h-4 mr-2" />
          Send password reset
        </Button>
        
        <Button variant="outline" className="w-full justify-start" size="sm"
          onClick={() => setDialog({ type: "force_logout" })}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Force logout
        </Button>
        
        <Button variant="outline" className="w-full justify-start" size="sm"
          onClick={() => setDialog({ type: "export" })}>
          <Download className="w-4 h-4 mr-2" />
          Export data (GDPR)
        </Button>
        
        <div className="border-t my-3" />
        
        {currentStatus === "active" && (
          <>
            <Button variant="outline" className="w-full justify-start text-orange-600 hover:text-orange-700" size="sm"
              onClick={() => setDialog({ type: "suspend" })}>
              <UserX className="w-4 h-4 mr-2" />
              Suspend
            </Button>
            
            <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" size="sm"
              onClick={() => setDialog({ type: "ban" })}>
              <Ban className="w-4 h-4 mr-2" />
              Ban
            </Button>
            
            <Button variant="outline" className="w-full justify-start text-red-700 hover:text-red-800" size="sm"
              onClick={() => setDialog({ type: "block" })}>
              <ShieldAlert className="w-4 h-4 mr-2" />
              Block (prevent re-signup)
            </Button>
          </>
        )}
        
        {currentStatus === "suspended" && (
          <Button variant="outline" className="w-full justify-start text-green-600" size="sm"
            onClick={() => setDialog({ type: "unsuspend" })}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Unsuspend
          </Button>
        )}
        
        {currentStatus === "banned" && (
          <Button variant="outline" className="w-full justify-start text-green-600" size="sm"
            onClick={() => setDialog({ type: "unban" })}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Unban
          </Button>
        )}
        
        <div className="border-t my-3" />
        
        <Button variant="outline" className="w-full justify-start text-destructive" size="sm"
          onClick={() => setDialog({ type: "soft_delete" })}>
          <Trash2 className="w-4 h-4 mr-2" />
          Soft delete
        </Button>
        
        {isOwner && (
          <Button variant="outline" className="w-full justify-start text-destructive border-destructive/40" size="sm"
            onClick={() => setDialog({ type: "hard_delete" })}>
            <Skull className="w-4 h-4 mr-2" />
            Hard delete (GDPR)
          </Button>
        )}
      </Card>
      
      <Dialog open={!!dialog} onOpenChange={(open) => { if (!open) { setDialog(null); setReason(""); setConfirmEmail(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTitle(dialog?.type)}</DialogTitle>
            <DialogDescription>{getDescription(dialog?.type, email)}</DialogDescription>
          </DialogHeader>
          
          {needsReason(dialog?.type) && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required, minimum 10 characters)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why. This is logged in the audit trail."
                rows={3}
              />
            </div>
          )}
          
          {dialog?.type === "hard_delete" && (
            <div className="space-y-2">
              <Label htmlFor="confirm-email" className="text-destructive">
                Type the customer's email to confirm: <strong>{email}</strong>
              </Label>
              <Input
                id="confirm-email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={email}
              />
              <p className="text-xs text-destructive">
                This is irreversible. All customer data will be permanently deleted.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialog(null); setReason(""); setConfirmEmail(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                submitting ||
                (needsReason(dialog?.type) && reason.length < 10) ||
                (dialog?.type === "hard_delete" && confirmEmail.toLowerCase() !== email.toLowerCase())
              }
              variant={isDestructive(dialog?.type) ? "destructive" : "default"}
            >
              {submitting ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getTitle(type?: string) {
  const titles: Record<string, string> = {
    suspend: "Suspend customer?",
    unsuspend: "Unsuspend customer?",
    ban: "Ban customer?",
    unban: "Unban customer?",
    block: "Block customer?",
    force_logout: "Force logout?",
    password_reset: "Send password reset email?",
    soft_delete: "Soft delete?",
    hard_delete: "Hard delete? (GDPR Erasure)",
    export: "Export customer data?",
  };
  return titles[type ?? ""] || "Confirm";
}

function getDescription(type?: string, email?: string) {
  const descriptions: Record<string, string> = {
    suspend: `${email} will lose access immediately and be logged out of all devices. They can be unsuspended later.`,
    unsuspend: `${email} will regain access immediately.`,
    ban: `${email} will lose access permanently. They will be logged out of all devices and cannot log in again unless unbanned.`,
    unban: `${email} will regain ability to log in.`,
    block: `${email} will be banned AND prevented from creating a new account with this email. Stronger than ban.`,
    force_logout: `${email} will be logged out of all devices. They can log in again immediately.`,
    password_reset: `${email} will receive an email with a link to set a new password. You will not see the link or new password.`,
    soft_delete: `${email}'s account will be hidden but data is retained. They cannot log in. Restorable later.`,
    hard_delete: `${email}'s account and all related data will be permanently deleted. This satisfies GDPR Right to Erasure. Cannot be undone.`,
    export: `Download all data we have about ${email} as a JSON file. This satisfies GDPR Subject Access Request.`,
  };
  return descriptions[type ?? ""] || "";
}

function needsReason(type?: string) {
  return ["suspend", "ban", "block"].includes(type ?? "");
}

function isDestructive(type?: string) {
  return ["suspend", "ban", "block", "soft_delete", "hard_delete"].includes(type ?? "");
}
