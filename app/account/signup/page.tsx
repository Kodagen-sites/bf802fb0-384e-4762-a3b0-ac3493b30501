// app/account/signup/page.tsx
//
// Customer signup page.
// Translated from working CRM src/pages/SignUp.tsx (263 lines).
// Adapted to Supabase Auth + Server Components.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "@/components/account/SignupForm";
import { getBrand } from "@/lib/brand";

export const metadata = {
  title: "Sign Up",
  description: "Create your account.",
};

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/account");
  
  const brand = await getBrand();
  
  return (
    <div className="min-h-screen flex">
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
            <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-2">It only takes a minute.</p>
          </div>
          
          <SignupForm />
          
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/account/login" className="text-foreground font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]">
        <div className="max-w-sm text-center text-white">
          <h2 className="text-3xl font-semibold mb-4">{brand.tagline || `Welcome to ${brand.name}`}</h2>
          {brand.signup_blurb && (
            <p className="text-white/80">{brand.signup_blurb}</p>
          )}
        </div>
      </div>
    </div>
  );
}
