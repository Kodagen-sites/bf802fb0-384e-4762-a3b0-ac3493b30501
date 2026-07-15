// app/account/auth/callback/route.ts
//
// Supabase Auth callback — handles OAuth + magic link + email verification returns.
// Exchanges the code for a session, then redirects to the next URL.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  
  if (error) {
    return NextResponse.redirect(
      `${origin}/account/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }
  
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // Update customer_profiles email_verified_at if not already set
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("customer_profiles")
          .update({
            email_verified_at: new Date().toISOString(),
            status: "active",
          })
          .eq("user_id", user.id)
          .is("email_verified_at", null);
        
        // Log the verification event
        await supabase.from("customer_activity").insert({
          user_id: user.id,
          event_type: "email_verified",
        });
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  
  return NextResponse.redirect(`${origin}/account/login?error=auth_callback_failed`);
}
