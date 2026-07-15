// app/account/login/page.tsx
//
// Customer login page.
// Translated from working CRM src/pages/Login.tsx (202 lines).
// Adapted to Next.js Server Components + Server Actions + Supabase Auth.
//
// Pattern preserved from CRM:
//  - Split-pane layout (form left, brand panel right)
//  - Inline verification recovery (when login returns EMAIL_NOT_VERIFIED, show OTP input)
//  - Show/hide password toggle
//  - Auto-redirect if already logged in
//  - Forgot password link

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/account/LoginForm";
import { getBrand } from "@/lib/brand";

export const metadata = {
  title: "Log In",
  description: "Log in to your account.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(params.next || "/account");
  
  const brand = await getBrand();
  
  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-8">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-8 w-auto" />
              ) : (
                <span className="text-xl font-semibold">{brand.name}</span>
              )}
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-2">Log in to your account.</p>
          </div>
          
          <LoginForm redirectTo={params.next || "/account"} />
          
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/account/signup" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      {/* Right — Brand panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]">
        <div className="max-w-sm text-center text-white">
          <h2 className="text-3xl font-semibold mb-4">{brand.tagline || `Welcome to ${brand.name}`}</h2>
          {brand.account_blurb && (
            <p className="text-white/80">{brand.account_blurb}</p>
          )}
        </div>
      </div>
    </div>
  );
}
