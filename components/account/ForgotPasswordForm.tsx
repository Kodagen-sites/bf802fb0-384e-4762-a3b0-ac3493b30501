// components/account/ForgotPasswordForm.tsx
//
// Three-step state machine translated from working CRM ForgotPassword.tsx:
//   Step 1 (email): User enters email
//   Step 2 (code): User enters code received via email + new password
//   Step 3 (done): Confirmation, redirect to login
//
// Adapted to Supabase. The original CRM did this in a single API: here we
// use Supabase resetPasswordForEmail which sends a magic link. The user
// clicks the link, lands on /account/reset-password (handled by callback),
// where they enter the new password.

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "email" | "sent";

export function ForgotPasswordForm() {
  const supabase = createClient();
  
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/account/reset-password`,
        }
      );
      
      // Generic message regardless of whether email exists (security best practice,
      // matches working CRM behavior — never disclose whether email is registered)
      setStep("sent");
    } catch (err) {
      // Even on error, show generic message
      setStep("sent");
    } finally {
      setLoading(false);
    }
  };
  
  if (step === "sent") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        <div>
          <h1 className="text-2xl font-semibold mb-2">Check your email</h1>
          <p className="text-muted-foreground">
            If an account exists with <strong>{email}</strong>, we've sent a password reset link.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
        </div>
        <Button variant="outline" asChild className="w-full">
          <Link href="/account/login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground mt-2">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      <form className="space-y-4" onSubmit={handleRequestReset}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1.5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>
        
        <Button className="w-full" size="lg" type="submit" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending link...</> : "Send reset link"}
        </Button>
        
        <Button variant="ghost" asChild className="w-full">
          <Link href="/account/login">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </Button>
      </form>
    </>
  );
}
