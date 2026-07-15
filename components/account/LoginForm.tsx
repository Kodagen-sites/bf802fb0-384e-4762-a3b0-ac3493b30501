// components/account/LoginForm.tsx
//
// Client Component for login form interactions.
// Translated from working CRM Login.tsx — preserves the inline verification
// recovery flow where if login returns EMAIL_NOT_VERIFIED, the OTP input
// appears below the password field without leaving the page.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Inline verification recovery — translated from CRM pattern
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail(null);
    setLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (signInError) {
        // Supabase returns "Email not confirmed" for unverified users
        if (signInError.message?.toLowerCase().includes("email not confirmed")) {
          setUnverifiedEmail(email.trim().toLowerCase());
          setError("Please verify your email first. Enter the code we sent you below.");
          return;
        }
        setError(signInError.message || "Invalid email or password");
        return;
      }
      
      // Check customer profile status (suspended/banned check happens here)
      // The middleware will redirect to /account/suspended if needed,
      // but we check here for a cleaner UX
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("status")
        .eq("user_id", data.user.id)
        .single();
      
      if (profile?.status === "suspended") {
        await supabase.auth.signOut();
        setError("Your account has been suspended. Please contact support.");
        return;
      }
      if (profile?.status === "banned") {
        await supabase.auth.signOut();
        setError("Your account has been banned.");
        return;
      }
      
      toast.success("Welcome back!");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unverifiedEmail || !code.trim()) return;
    setError("");
    setCodeLoading(true);
    
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: unverifiedEmail,
        token: code.trim(),
        type: "signup",
      });
      if (verifyError) {
        setError(verifyError.message || "Invalid or expired code");
        return;
      }
      toast.success("Email verified!");
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setCodeLoading(false);
    }
  };
  
  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    setError("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
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
  
  return (
    <form className="space-y-4" onSubmit={handleLogin}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="mt-1.5"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          required
          autoComplete="email"
        />
      </div>
      
      <div>
        <div className="flex justify-between items-center">
          <Label htmlFor="password">Password</Label>
          <Link href="/account/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="pr-10"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            required
            autoComplete="current-password"
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
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      <Button className="w-full" size="lg" type="submit" disabled={loading}>
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Log in"}
      </Button>
      
      {/* Inline verification recovery — preserved from working CRM pattern */}
      {unverifiedEmail && (
        <div className="mt-4 pt-4 border-t space-y-3">
          <Label>Verification code</Label>
          <div className="flex gap-2">
            <Input
              placeholder="000000"
              className="font-mono tracking-widest flex-1"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              autoComplete="one-time-code"
            />
            <Button type="button" onClick={handleVerify} disabled={code.length !== 6 || codeLoading}>
              {codeLoading ? "..." : "Verify"}
            </Button>
          </div>
          <Button type="button" variant="ghost" size="sm" disabled={resendLoading} onClick={handleResend}>
            {resendLoading ? "Sending..." : "Resend code"}
          </Button>
        </div>
      )}
    </form>
  );
}
