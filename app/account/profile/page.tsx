// app/account/profile/page.tsx
//
// Customer profile edit page.
// Translated from working CRM SettingsPage.tsx (209 lines).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");
  
  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-semibold mb-8">Profile</h1>
      <ProfileForm
        profile={profile}
        userEmail={user.email!}
      />
    </div>
  );
}
