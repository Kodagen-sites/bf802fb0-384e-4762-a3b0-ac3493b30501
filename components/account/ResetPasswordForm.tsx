// components/account/ResetPasswordForm.tsx
//
// Final step of password reset — user enters new password.
// Translated from working CRM ForgotPassword.tsx step="code" branch.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        setError(updateError.message || "Failed to update password");
        return;
      }
      
      // Log the password reset in customer_activity
      if (data.user) {
        await supabase.from("customer_activity").insert({
          user_id: data.user.id,
          event_type: "password_reset_completed",
        });
      }
      
      toast.success("Password updated. You're logged in.");
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="new-password">New password</Label>
        <div className="relative mt-1.5">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            className="pr-10"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div>
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm your password"
          className="mt-1.5"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      <Button className="w-full" size="lg" type="submit" disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : "Update password"}
      </Button>
    </form>
  );
}
