// components/AccountHeader.tsx
//
// Header for /account/* routes (public auth + customer dashboard).
// Brand-themed. Shows Sign In / Sign Up when not logged in, avatar dropdown when logged in.

"use client";

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

type Props = {
  brand: { name: string; logo?: string | null; primary_color?: string };
  user: { id: string; email?: string } | null;
  customerProfile: { display_name: string | null; full_name: string | null; status: string; avatar_url: string | null } | null;
};

export function AccountHeader({ brand, user, customerProfile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  
  const displayName = customerProfile?.display_name || customerProfile?.full_name || user?.email?.split("@")[0] || "";
  const initials = displayName.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() || "?";
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };
  
  return (
    <header className="border-b bg-background">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="h-8 w-auto" />
          ) : (
            <span className="text-lg font-semibold">{brand.name}</span>
          )}
        </Link>
        
        <nav className="flex items-center gap-2">
          {!user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/account/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/account/signup">Sign up</Link>
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    {customerProfile?.avatar_url && (
                      <AvatarImage src={customerProfile.avatar_url} alt={displayName} />
                    )}
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{displayName}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          )}
        </nav>
      </div>
    </header>
  );
}
