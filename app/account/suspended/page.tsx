// app/account/suspended/page.tsx
//
// Where suspended/banned customers are redirected. Shows their status,
// the reason if available, and contact info for support.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";
import { getBrand } from "@/lib/brand";

export const metadata = {
  title: "Account Restricted",
  robots: { index: false },
};

export default async function SuspendedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("status, suspended_reason, banned_reason, suspended_at, banned_at")
    .eq("user_id", user.id)
    .single();
  
  // If they're not actually restricted, send them home
  if (profile?.status === "active") redirect("/account");
  
  const brand = await getBrand();
  
  const isSuspended = profile?.status === "suspended";
  const isBanned = profile?.status === "banned";
  const reason = isSuspended ? profile?.suspended_reason : profile?.banned_reason;
  const since = isSuspended ? profile?.suspended_at : profile?.banned_at;
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">
            {isBanned ? "Account banned" : "Account suspended"}
          </h1>
          <p className="text-muted-foreground">
            {isBanned
              ? "Your account access has been permanently revoked."
              : "Your account access has been temporarily suspended."}
          </p>
        </div>
        
        {reason && (
          <div className="bg-muted rounded-lg p-4 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Reason</p>
            <p className="text-sm">{reason}</p>
          </div>
        )}
        
        {since && (
          <p className="text-xs text-muted-foreground text-center">
            Effective {new Date(since).toLocaleDateString()}
          </p>
        )}
        
        <div className="space-y-3">
          <p className="text-sm text-center text-muted-foreground">
            If you believe this is an error, please contact us.
          </p>
          {brand.contact_email && (
            <Button variant="outline" asChild className="w-full">
              <a href={`mailto:${brand.contact_email}?subject=Account%20${isBanned ? "Ban" : "Suspension"}%20Inquiry`}>
                <Mail className="w-4 h-4 mr-2" />
                {brand.contact_email}
              </a>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
