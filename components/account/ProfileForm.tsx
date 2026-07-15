// components/account/ProfileForm.tsx
//
// Edit profile, marketing preferences, password.
// Translated from working CRM SettingsPage.tsx structure.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Profile = {
  user_id: string;
  display_name: string | null;
  full_name: string | null;
  phone: string | null;
  marketing_consent: boolean;
};

export function ProfileForm({ profile, userEmail }: { profile: Profile | null; userEmail: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [form, setForm] = useState({
    display_name: profile?.display_name ?? "",
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    marketing_consent: profile?.marketing_consent ?? false,
  });
  const [saving, setSaving] = useState(false);
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("customer_profiles")
        .update({
          display_name: form.display_name || null,
          full_name: form.full_name || null,
          phone: form.phone || null,
          marketing_consent: form.marketing_consent,
          marketing_consent_at: form.marketing_consent ? new Date().toISOString() : null,
        })
        .eq("user_id", profile!.user_id);
      
      if (error) {
        toast.error(error.message || "Failed to save");
        return;
      }
      
      // Log activity
      await supabase.from("customer_activity").insert({
        user_id: profile!.user_id,
        event_type: "profile_updated",
      });
      
      toast.success("Profile updated");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Personal info</h2>
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={userEmail} disabled className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1">
            To change your email, contact support.
          </p>
        </div>
        
        <div>
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            placeholder="How you'd like us to greet you"
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="full-name">Full name</Label>
          <Input
            id="full-name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Your full legal name"
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1 555 555 5555"
            className="mt-1.5"
          />
        </div>
      </Card>
      
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Communication preferences</h2>
        
        <div className="flex items-start gap-3">
          <Checkbox
            id="marketing"
            checked={form.marketing_consent}
            onCheckedChange={(val) => setForm((f) => ({ ...f, marketing_consent: val as boolean }))}
            className="mt-0.5"
          />
          <Label htmlFor="marketing" className="text-sm leading-snug font-normal">
            Send me occasional emails about new offerings, promotions, and updates.
            <span className="block text-muted-foreground text-xs mt-1">
              You can change this at any time.
            </span>
          </Label>
        </div>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
