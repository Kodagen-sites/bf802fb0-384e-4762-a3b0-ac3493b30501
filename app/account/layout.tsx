// app/account/layout.tsx
//
// Layout for all /account/* routes (public auth + customer dashboard).
// Renders brand-themed header with sign-in/sign-up state.
//
// Translated from working CRM's split-pane layout pattern in src/pages/Login.tsx.

import { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AccountHeader } from "@/components/AccountHeader";
import { getBrand } from "@/lib/brand";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let customerProfile = null;
  if (user) {
    const { data } = await supabase
      .from("customer_profiles")
      .select("display_name, full_name, status, avatar_url")
      .eq("user_id", user.id)
      .single();
    customerProfile = data;
  }
  
  const brand = await getBrand();
  
  return (
    <div className="min-h-screen bg-background">
      <AccountHeader brand={brand} user={user} customerProfile={customerProfile} />
      {children}
    </div>
  );
}
