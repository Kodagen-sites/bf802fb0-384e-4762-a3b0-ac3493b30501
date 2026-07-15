// app/account/reset-password/page.tsx
//
// Where the user lands after clicking the password reset link in their email.
// At this point Supabase has set a recovery session via the URL fragment.
// The user just needs to set a new password.

import Link from "next/link";
import { ResetPasswordForm } from "@/components/account/ResetPasswordForm";
import { getBrand } from "@/lib/brand";

export const metadata = {
  title: "Set New Password",
  robots: { index: false },
};

export default async function ResetPasswordPage() {
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
          <h1 className="text-3xl font-semibold tracking-tight">Set a new password</h1>
          <p className="text-muted-foreground mt-2">Choose a password you haven&apos;t used before.</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
