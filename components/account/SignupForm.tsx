// components/account/SignupForm.tsx
//
// Translated from working CRM SignUp.tsx (263 lines).
// Two-step flow: form → verification code (preserved from CRM pattern).
// Uses Supabase Auth signUp + verifyOtp instead of custom JWT.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function SignupForm() {
  const router = useRouter();
  const supabase = createClient();
  
  const [agreed, setAgreed] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const normalizedEmail = form.email.trim().toLowerCase();
      
      // Check blocked_emails table first — prevents re-signup with banned email
      const { data: blocked } = await supabase
        .from("blocked_emails")
        .select("email")
        .eq("email", normalizedEmail)
        .is("unblocked_at", null)
        .maybeSingle();
      
      if (blocked) {
        setError("Unable to create account with this email. Please contact support.");
        return;
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/account/auth/callback?next=/account`,
          data: {
            display_name: form.displayName || undefined,
            marketing_consent: marketingConsent,
          },
        },
      });
      
      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes("already registered")) {
          setError("An account with this email already exists. Try logging in instead.");
          return;
        }
        setError(signUpError.message || "Registration failed");
        return;
      }
      
      // Insert customer_profiles row (the auth.users row was just created by signUp)
      // This is normally done by a server-side trigger, but we do it here to make
      // marketing consent + referral tracking explicit.
      if (data.user) {
        await supabase.from("customer_profiles").insert({
          user_id: data.user.id,
          display_name: form.displayName || null,
          marketing_consent: marketingConsent,
          marketing_consent_at: marketingConsent ? new Date().toISOString() : null,
          referral_source: typeof window !== "undefined" ? sessionStorage.getItem("referral_source") : null,
          status: "pending_verification",
        });
        
        await supabase.from("customer_activity").insert({
          user_id: data.user.id,
          event_type: "signup",
          metadata: { display_name: form.displayName, marketing_consent: marketingConsent },
        });
      }
      
      // Supabase auto-sends verification email — show code input UI
      setPendingEmail(normalizedEmail);
      toast.success("Check your email for the verification code.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail || !code.trim()) return;
    setError("");
    setCodeLoading(true);
    
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: code.trim(),
        type: "signup",
      });
      
      if (verifyError) {
        setError(verifyError.message || "Invalid or expired code");
        return;
      }
      
      // Mark profile as active + record verification
      if (data.user) {
        await supabase
          .from("customer_profiles")
          .update({
            status: "active",
            email_verified_at: new Date().toISOString(),
          })
          .eq("user_id", data.user.id);
        
        await supabase.from("customer_activity").insert({
          user_id: data.user.id,
          event_type: "email_verified",
        });
      }
      
      toast.success("Email verified!");
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setCodeLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (!pendingEmail) return;
    setResendLoading(true);
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingEmail,
      });
      if (resendError) {
        setError(resendError.message || "Failed to resend");
        return;
      }
      toast.success("Verification code sent again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setResendLoading(false);
    }
  };
  
  // Step 2: verification code entry
  if (pendingEmail) {
    return (
      <form className="space-y-4" onSubmit={handleVerify}>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it below.
        </p>
        <div>
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            placeholder="000000"
            className="mt-1.5 font-mono text-lg tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            autoComplete="one-time-code"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" size="lg" disabled={code.length !== 6 || codeLoading} type="submit">
          {codeLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify email"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={resendLoading}
          onClick={handleResend}
        >
          {resendLoading ? "Sending..." : "Resend code"}
        </Button>
      </form>
    );
  }
  
  // Step 1: signup form
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="Your full name"
          className="mt-1.5"
          value={form.displayName}
          onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
          autoComplete="name"
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="mt-1.5"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          required
          autoComplete="email"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            className="pr-10"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            autoComplete="new-password"
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
        <Label htmlFor="confirm">Confirm Password</Label>
        <div className="relative mt-1.5">
          <Input
            id="confirm"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            className="pr-10"
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      <div className="space-y-3 pt-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="agreed"
            checked={agreed}
            onCheckedChange={(val) => setAgreed(val as boolean)}
            className="mt-0.5"
          />
          <Label htmlFor="agreed" className="text-sm text-muted-foreground leading-snug font-normal">
            I agree to the Terms of Service and Privacy Policy
          </Label>
        </div>
        <div className="flex items-start gap-2">
          <Checkbox
            id="marketing"
            checked={marketingConsent}
            onCheckedChange={(val) => setMarketingConsent(val as boolean)}
            className="mt-0.5"
          />
          <Label htmlFor="marketing" className="text-sm text-muted-foreground leading-snug font-normal">
            Send me occasional emails about new offerings (optional)
          </Label>
        </div>
      </div>
      
      <Button className="w-full" size="lg" disabled={!agreed || loading} type="submit">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create account"}
      </Button>
    </form>
  );
}
