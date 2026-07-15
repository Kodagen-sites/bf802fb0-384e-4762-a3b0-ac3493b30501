// components/AccountAuthLinks.tsx
//
// Reusable Sign In / Sign Up links for the public site header.
// Conditionally rendered when manifest.auth_strategy != "none".
//
// When customer is logged in: shows avatar + display name with dropdown
// (My Account, Profile, Sign Out).
// When customer is logged out: shows "Sign in" + "Sign up" links.
//
// Usage in a Header variant (any of the 10 in templates/shared/headers/):
//
//   import { AccountAuthLinks } from "@/components/AccountAuthLinks";
//   import { siteConfig } from "@/content/site-config";
//
//   {(siteConfig as any).authStrategy !== "none" && (
//     <AccountAuthLinks variant="pill" />
//   )}
//
// The `variant` prop tunes styling for header context: "pill" (compact, fits
// in a tight pill header), "default" (standard horizontal links), "stacked"
// (mobile menu / drawer).

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User as UserIcon, LogOut, Settings, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type Variant = "pill" | "default" | "stacked";

type CustomerProfile = {
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export function AccountAuthLinks({ variant = "default" }: { variant?: Variant }) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(user);
      
      if (user) {
        const { data } = await supabase
          .from("customer_profiles")
          .select("display_name, full_name, avatar_url")
          .eq("user_id", user.id)
          .single();
        if (mounted) setProfile(data);
      }
      
      if (mounted) setLoading(false);
    }
    
    load();
    
    // Listen for auth changes (sign out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (!session?.user) setProfile(null);
      }
    });
    
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [supabase]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };
  
  // While loading, render nothing — avoids layout flash when state resolves
  if (loading) return null;
  
  const displayName = profile?.display_name || profile?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  
  // ─── Logged in: avatar dropdown ──────────────────────────────────────
  if (user) {
    if (variant === "stacked") {
      return (
        <div className="flex flex-col gap-2 w-full">
          <Link href="/account" className="text-sm py-2 hover:underline">
            <UserIcon className="w-4 h-4 inline mr-2" />
            My account
          </Link>
          <Link href="/account/profile" className="text-sm py-2 hover:underline">
            <Settings className="w-4 h-4 inline mr-2" />
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm py-2 hover:underline text-left"
          >
            <LogOut className="w-4 h-4 inline mr-2" />
            Sign out
          </button>
        </div>
      );
    }
    
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={
              variant === "pill"
                ? "flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-white text-xs"
                : "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted text-sm"
            }
          >
            <Avatar className="h-6 w-6">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline">{displayName}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/account">
              <UserIcon className="w-4 h-4 mr-2" />
              My account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/profile">
              <Settings className="w-4 h-4 mr-2" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // ─── Logged out: Sign In + Sign Up ───────────────────────────────────
  if (variant === "stacked") {
    return (
      <div className="flex flex-col gap-2 w-full">
        <Link href="/account/login" className="text-sm py-2 hover:underline">
          Sign in
        </Link>
        <Link
          href="/account/signup"
          className="text-sm py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 text-center"
        >
          Sign up
        </Link>
      </div>
    );
  }
  
  if (variant === "pill") {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/account/login"
          className="px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-[0.15em] text-white/70 hover:text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account/login">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/account/signup">Sign up</Link>
      </Button>
    </div>
  );
}
