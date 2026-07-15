// app/account/forgot-password/page.tsx
//
// Three-step state machine: email → code → done.
// Translated from working CRM ForgotPassword.tsx (232 lines).
// Adapted to Supabase resetPasswordForEmail.

import Link from "next/link";
import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";
import { getBrand } from "@/lib/brand";

export const metadata = {
  title: "Reset Password",
  description: "Reset your account password.",
  robots: { index: false },
};

export default async function ForgotPasswordPage() {
  const brand = await getBrand();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-8">
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-semibold">{brand.name}</span>
            )}
          </Link>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
